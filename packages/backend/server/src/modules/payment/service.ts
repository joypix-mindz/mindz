import { Injectable, Logger } from '@nestjs/common';
import { OnEvent as RawOnEvent } from '@nestjs/event-emitter';
import type {
  Prisma,
  User,
  UserInvoice,
  UserStripeCustomer,
  UserSubscription,
} from '@prisma/client';
import Stripe from 'stripe';

import { Config } from '../../config';
import { PrismaService } from '../../prisma';

const OnEvent = (
  event: Stripe.Event.Type,
  opts?: Parameters<typeof RawOnEvent>[1]
) => RawOnEvent(event, opts);

// Plan x Recurring make a stripe price lookup key
export enum SubscriptionRecurring {
  Monthly = 'monthly',
  Yearly = 'yearly',
}

export enum SubscriptionPlan {
  Free = 'free',
  Pro = 'pro',
  Team = 'team',
  Enterprise = 'enterprise',
}

export function encodeLookupKey(
  plan: SubscriptionPlan,
  recurring: SubscriptionRecurring
): string {
  return plan + '_' + recurring;
}

export function decodeLookupKey(
  key: string
): [SubscriptionPlan, SubscriptionRecurring] {
  const [plan, recurring] = key.split('_');

  return [plan as SubscriptionPlan, recurring as SubscriptionRecurring];
}

// see https://stripe.com/docs/api/subscriptions/object#subscription_object-status
export enum SubscriptionStatus {
  Active = 'active',
  PastDue = 'past_due',
  Unpaid = 'unpaid',
  Canceled = 'canceled',
  Incomplete = 'incomplete',
  Paused = 'paused',
  IncompleteExpired = 'incomplete_expired',
  Trialing = 'trialing',
}

export enum InvoiceStatus {
  Draft = 'draft',
  Open = 'open',
  Void = 'void',
  Paid = 'paid',
  Uncollectible = 'uncollectible',
}

export enum Coupon {
  EarlyAccess = 'earlyaccess',
  EarlyAccessRenew = 'earlyaccessrenew',
}

@Injectable()
export class SubscriptionService {
  private readonly paymentConfig: Config['payment'];
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    config: Config,
    private readonly stripe: Stripe,
    private readonly db: PrismaService
  ) {
    this.paymentConfig = config.payment;

    if (
      !this.paymentConfig.stripe.keys.APIKey ||
      !this.paymentConfig.stripe.keys.webhookKey /* default empty string */
    ) {
      this.logger.warn('Stripe API key not set, Stripe will be disabled');
      this.logger.warn('Set STRIPE_API_KEY to enable Stripe');
    }
  }

  async listPrices() {
    return this.stripe.prices.list();
  }

  async createCheckoutSession({
    user,
    recurring,
    redirectUrl,
    plan = SubscriptionPlan.Pro,
  }: {
    user: User;
    plan?: SubscriptionPlan;
    recurring: SubscriptionRecurring;
    redirectUrl: string;
  }) {
    const currentSubscription = await this.db.userSubscription.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (currentSubscription && currentSubscription.end < new Date()) {
      throw new Error('You already have a subscription');
    }

    const price = await this.getPrice(plan, recurring);

    const customer = await this.getOrCreateCustomer(user);
    return await this.stripe.checkout.sessions.create({
      line_items: [
        {
          price,
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      tax_id_collection: {
        enabled: true,
      },
      mode: 'subscription',
      success_url: redirectUrl,
      customer: customer.stripeCustomerId,
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
    });
  }

  async cancelSubscription(userId: string): Promise<UserSubscription> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        subscription: true,
      },
    });

    if (!user?.subscription) {
      throw new Error('You do not have any subscription');
    }

    if (user.subscription.canceledAt) {
      throw new Error('Your subscription has already been canceled');
    }

    // should release the schedule first
    if (user.subscription.stripeScheduleId) {
      await this.cancelSubscriptionSchedule(user.subscription.stripeScheduleId);
      return this.saveSubscription(
        user,
        await this.stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        )
      );
    } else {
      // let customer contact support if they want to cancel immediately
      // see https://stripe.com/docs/billing/subscriptions/cancel
      const subscription = await this.stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      );
      return await this.saveSubscription(user, subscription);
    }
  }

  async resumeCanceledSubscription(userId: string): Promise<UserSubscription> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        subscription: true,
      },
    });

    if (!user?.subscription) {
      throw new Error('You do not have any subscription');
    }

    if (!user.subscription.canceledAt) {
      throw new Error('Your subscription has not been canceled');
    }

    if (user.subscription.end < new Date()) {
      throw new Error('Your subscription is expired, please checkout again.');
    }

    if (user.subscription.stripeScheduleId) {
      await this.resumeSubscriptionSchedule(user.subscription.stripeScheduleId);
      return this.saveSubscription(
        user,
        await this.stripe.subscriptions.retrieve(
          user.subscription.stripeSubscriptionId
        )
      );
    } else {
      const subscription = await this.stripe.subscriptions.update(
        user.subscription.stripeSubscriptionId,
        {
          cancel_at_period_end: false,
        }
      );

      return await this.saveSubscription(user, subscription);
    }
  }

  async updateSubscriptionRecurring(
    userId: string,
    recurring: SubscriptionRecurring
  ): Promise<UserSubscription> {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        subscription: true,
      },
    });

    if (!user?.subscription) {
      throw new Error('You do not have any subscription');
    }

    if (user.subscription.canceledAt) {
      throw new Error('Your subscription has already been canceled ');
    }

    if (user.subscription.recurring === recurring) {
      throw new Error('You have already subscribed to this plan');
    }

    const price = await this.getPrice(
      user.subscription.plan as SubscriptionPlan,
      recurring
    );

    let scheduleId: string | null;
    // a schedule existing
    if (user.subscription.stripeScheduleId) {
      scheduleId = await this.scheduleNewPrice(
        user.subscription.stripeScheduleId,
        price
      );
    } else {
      const schedule = await this.stripe.subscriptionSchedules.create({
        from_subscription: user.subscription.stripeSubscriptionId,
      });
      await this.scheduleNewPrice(schedule.id, price);
      scheduleId = schedule.id;
    }

    return await this.db.userSubscription.update({
      where: {
        id: user.subscription.id,
      },
      data: {
        stripeScheduleId: scheduleId,
        recurring,
      },
    });
  }

  async createCustomerPortal(id: string) {
    const user = await this.db.userStripeCustomer.findUnique({
      where: {
        userId: id,
      },
    });

    if (!user) {
      throw new Error('Unknown user');
    }

    try {
      const portal = await this.stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
      });

      return portal.url;
    } catch (e) {
      this.logger.error('Failed to create customer portal.', e);
      throw new Error('Failed to create customer portal');
    }
  }

  @OnEvent('customer.subscription.created')
  @OnEvent('customer.subscription.updated')
  async onSubscriptionChanges(subscription: Stripe.Subscription) {
    const user = await this.retrieveUserFromCustomer(
      subscription.customer as string
    );

    await this.saveSubscription(user, subscription);
  }

  @OnEvent('customer.subscription.deleted')
  async onSubscriptionDeleted(subscription: Stripe.Subscription) {
    const user = await this.retrieveUserFromCustomer(
      subscription.customer as string
    );

    await this.db.userSubscription.deleteMany({
      where: {
        stripeSubscriptionId: subscription.id,
        userId: user.id,
      },
    });
  }

  @OnEvent('invoice.created')
  @OnEvent('invoice.paid')
  @OnEvent('invoice.finalization_failed')
  @OnEvent('invoice.payment_failed')
  async saveInvoice(stripeInvoice: Stripe.Invoice) {
    if (!stripeInvoice.customer) {
      throw new Error('Unexpected invoice with no customer');
    }

    const user = await this.retrieveUserFromCustomer(
      typeof stripeInvoice.customer === 'string'
        ? stripeInvoice.customer
        : stripeInvoice.customer.id
    );

    const invoice = await this.db.userInvoice.findUnique({
      where: {
        stripeInvoiceId: stripeInvoice.id,
      },
    });

    const data: Partial<UserInvoice> = {
      currency: stripeInvoice.currency,
      amount: stripeInvoice.total,
      status: stripeInvoice.status ?? InvoiceStatus.Void,
      link: stripeInvoice.hosted_invoice_url,
    };

    // handle payment error
    if (stripeInvoice.attempt_count > 1) {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        stripeInvoice.payment_intent as string
      );

      if (paymentIntent.last_payment_error) {
        if (paymentIntent.last_payment_error.type === 'card_error') {
          data.lastPaymentError =
            paymentIntent.last_payment_error.message ?? 'Failed to pay';
        } else {
          data.lastPaymentError = 'Internal Payment error';
        }
      }
    } else if (stripeInvoice.last_finalization_error) {
      if (stripeInvoice.last_finalization_error.type === 'card_error') {
        data.lastPaymentError =
          stripeInvoice.last_finalization_error.message ??
          'Failed to finalize invoice';
      } else {
        data.lastPaymentError = 'Internal Payment error';
      }
    }

    // update invoice
    if (invoice) {
      await this.db.userInvoice.update({
        where: {
          stripeInvoiceId: stripeInvoice.id,
        },
        data,
      });
    } else {
      // create invoice
      const price = stripeInvoice.lines.data[0].price;

      if (!price || price.type !== 'recurring') {
        throw new Error('Unexpected invoice with no recurring price');
      }

      if (!price.lookup_key) {
        throw new Error('Unexpected subscription with no key');
      }

      const [plan, recurring] = decodeLookupKey(price.lookup_key);

      await this.db.userInvoice.create({
        data: {
          userId: user.id,
          stripeInvoiceId: stripeInvoice.id,
          plan,
          recurring,
          reason: stripeInvoice.billing_reason ?? 'contact support',
          ...(data as any),
        },
      });
    }
  }

  private async saveSubscription(
    user: User,
    subscription: Stripe.Subscription,
    fromWebhook = true
  ): Promise<UserSubscription> {
    // webhook events may not in sequential order
    // always fetch the latest subscription and save
    // see https://stripe.com/docs/webhooks#behaviors
    if (fromWebhook) {
      subscription = await this.stripe.subscriptions.retrieve(subscription.id);
    }

    // get next bill date from upcoming invoice
    // see https://stripe.com/docs/api/invoices/upcoming
    let nextBillAt: Date | null = null;
    if (
      (subscription.status === SubscriptionStatus.Active ||
        subscription.status === SubscriptionStatus.Trialing) &&
      !subscription.canceled_at
    ) {
      nextBillAt = new Date(subscription.current_period_end * 1000);
    }

    const price = subscription.items.data[0].price;
    if (!price.lookup_key) {
      throw new Error('Unexpected subscription with no key');
    }

    const [plan, recurring] = decodeLookupKey(price.lookup_key);

    const commonData = {
      start: new Date(subscription.current_period_start * 1000),
      end: new Date(subscription.current_period_end * 1000),
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : null,
      trialEnd: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      nextBillAt,
      canceledAt: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000)
        : null,
      stripeSubscriptionId: subscription.id,
      plan,
      recurring,
      status: subscription.status,
      stripeScheduleId: subscription.schedule as string | null,
    };

    const currentSubscription = await this.db.userSubscription.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (currentSubscription) {
      const update: Prisma.UserSubscriptionUpdateInput = {
        ...commonData,
      };

      // a schedule exists, update the recurring to scheduled one
      if (update.stripeScheduleId) {
        delete update.recurring;
      }

      return await this.db.userSubscription.update({
        where: {
          id: currentSubscription.id,
        },
        data: update,
      });
    } else {
      return await this.db.userSubscription.create({
        data: {
          userId: user.id,
          ...commonData,
        },
      });
    }
  }

  private async getOrCreateCustomer(user: User): Promise<UserStripeCustomer> {
    const customer = await this.db.userStripeCustomer.findUnique({
      where: {
        userId: user.id,
      },
    });

    if (customer) {
      return customer;
    }

    const stripeCustomersList = await this.stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let stripeCustomer: Stripe.Customer | undefined;
    if (stripeCustomersList.data.length) {
      stripeCustomer = stripeCustomersList.data[0];
    } else {
      stripeCustomer = await this.stripe.customers.create({
        email: user.email,
      });
    }

    return await this.db.userStripeCustomer.create({
      data: {
        userId: user.id,
        stripeCustomerId: stripeCustomer.id,
      },
    });
  }

  private async retrieveUserFromCustomer(customerId: string) {
    const customer = await this.db.userStripeCustomer.findUnique({
      where: {
        stripeCustomerId: customerId,
      },
      include: {
        user: true,
      },
    });

    if (customer?.user) {
      return customer.user;
    }

    // customer may not saved is db, check it with stripe
    const stripeCustomer = await this.stripe.customers.retrieve(customerId);

    if (stripeCustomer.deleted) {
      throw new Error('Unexpected subscription created with deleted customer');
    }

    if (!stripeCustomer.email) {
      throw new Error('Unexpected subscription created with no email customer');
    }

    const user = await this.db.user.findUnique({
      where: {
        email: stripeCustomer.email,
      },
    });

    if (!user) {
      throw new Error(
        `Unexpected subscription created with unknown customer ${stripeCustomer.email}`
      );
    }

    await this.db.userStripeCustomer.create({
      data: {
        userId: user.id,
        stripeCustomerId: stripeCustomer.id,
      },
    });

    return user;
  }

  private async getPrice(
    plan: SubscriptionPlan,
    recurring: SubscriptionRecurring
  ): Promise<string> {
    const prices = await this.stripe.prices.list({
      lookup_keys: [encodeLookupKey(plan, recurring)],
    });

    if (!prices.data.length) {
      throw new Error(
        `Unknown subscription plan ${plan} with recurring ${recurring}`
      );
    }

    return prices.data[0].id;
  }

  /**
   * If a subscription is managed by a schedule, it has a different way to cancel.
   */
  private async cancelSubscriptionSchedule(scheduleId: string) {
    const schedule =
      await this.stripe.subscriptionSchedules.retrieve(scheduleId);

    const currentPhase = schedule.phases.find(
      phase =>
        phase.start_date * 1000 < Date.now() &&
        phase.end_date * 1000 > Date.now()
    );

    if (
      schedule.status !== 'active' ||
      schedule.phases.length > 2 ||
      !currentPhase
    ) {
      throw new Error('Unexpected subscription schedule status');
    }

    if (schedule.status !== 'active') {
      throw new Error('unexpected subscription schedule status');
    }

    const nextPhase = schedule.phases.find(
      phase => phase.start_date * 1000 > Date.now()
    );

    if (!currentPhase) {
      throw new Error('Unexpected subscription schedule status');
    }

    const update: Stripe.SubscriptionScheduleUpdateParams.Phase = {
      items: [
        {
          price: currentPhase.items[0].price as string,
          quantity: 1,
        },
      ],
      coupon: (currentPhase.coupon as string | null) ?? undefined,
      start_date: currentPhase.start_date,
      end_date: currentPhase.end_date,
    };

    if (nextPhase) {
      // cancel a subscription with a schedule exiting will delete the upcoming phase,
      // it's hard to recover the subscription to the original state if user wan't to resume before due.
      // so we manually save the next phase's key information to metadata for later easy resuming.
      update.metadata = {
        next_coupon: (nextPhase.coupon as string | null) || null, // avoid empty string
        next_price: nextPhase.items[0].price as string,
      };
    }

    await this.stripe.subscriptionSchedules.update(schedule.id, {
      phases: [update],
      end_behavior: 'cancel',
    });
  }

  private async resumeSubscriptionSchedule(scheduleId: string) {
    const schedule =
      await this.stripe.subscriptionSchedules.retrieve(scheduleId);

    const currentPhase = schedule.phases.find(
      phase =>
        phase.start_date * 1000 < Date.now() &&
        phase.end_date * 1000 > Date.now()
    );

    if (schedule.status !== 'active' || !currentPhase) {
      throw new Error('Unexpected subscription schedule status');
    }

    const update: Stripe.SubscriptionScheduleUpdateParams.Phase[] = [
      {
        items: [
          {
            price: currentPhase.items[0].price as string,
            quantity: 1,
          },
        ],
        coupon: (currentPhase.coupon as string | null) ?? undefined,
        start_date: currentPhase.start_date,
        end_date: currentPhase.end_date,
        metadata: {
          next_coupon: null,
          next_price: null,
        },
      },
    ];

    if (currentPhase.metadata && currentPhase.metadata.next_price) {
      update.push({
        items: [
          {
            price: currentPhase.metadata.next_price,
            quantity: 1,
          },
        ],
        coupon: currentPhase.metadata.next_coupon || undefined,
      });
    }

    await this.stripe.subscriptionSchedules.update(schedule.id, {
      phases: update,
      end_behavior: 'release',
    });
  }

  /**
   * we only schedule a new price when user change the recurring plan and there is now upcoming phases.
   */
  private async scheduleNewPrice(
    scheduleId: string,
    priceId: string
  ): Promise<string | null> {
    const schedule =
      await this.stripe.subscriptionSchedules.retrieve(scheduleId);

    const currentPhase = schedule.phases.find(
      phase =>
        phase.start_date * 1000 < Date.now() &&
        phase.end_date * 1000 > Date.now()
    );

    if (schedule.status !== 'active' || !currentPhase) {
      throw new Error('Unexpected subscription schedule status');
    }

    // if current phase's plan matches target, just release the schedule
    if (currentPhase.items[0].price === priceId) {
      await this.stripe.subscriptionSchedules.release(scheduleId);
      return null;
    } else {
      await this.stripe.subscriptionSchedules.update(schedule.id, {
        phases: [
          {
            items: [
              {
                price: currentPhase.items[0].price as string,
              },
            ],
            start_date: schedule.phases[0].start_date,
            end_date: schedule.phases[0].end_date,
          },
          {
            items: [
              {
                price: priceId,
                quantity: 1,
              },
            ],
          },
        ],
      });

      return scheduleId;
    }
  }
}
