import { NavigateContext } from '@affine/core/hooks/use-navigate-helper';
import { wrapCreateBrowserRouter } from '@sentry/react';
import { useEffect, useState } from 'react';
import type { RouteObject } from 'react-router-dom';
import {
  createBrowserRouter as reactRouterCreateBrowserRouter,
  Outlet,
  redirect,
  useNavigate,
} from 'react-router-dom';

import { Component as All } from './pages/workspace/all';
import { Component as Collection } from './pages/workspace/collection';
import { Component as CollectionDetail } from './pages/workspace/collection/detail';
import { Component as Home } from './pages/workspace/home';
import { Component as Search } from './pages/workspace/search';
import { Component as Tag } from './pages/workspace/tag';
import { Component as TagDetail } from './pages/workspace/tag/detail';
import { AllWorkspaceModals } from './provider/model-provider';

function RootRouter() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // a hack to make sure router is ready
    setReady(true);
  }, []);

  return (
    ready && (
      <NavigateContext.Provider value={navigate}>
        <AllWorkspaceModals />
        <Outlet />
      </NavigateContext.Provider>
    )
  );
}

export const topLevelRoutes = [
  {
    element: <RootRouter />,
    children: [
      {
        path: '/',
        lazy: () => import('./pages/index'),
      },
      {
        path: '/workspace/:workspaceId/*',
        lazy: () => import('./pages/workspace/index'),
      },
      {
        path: '/share/:workspaceId/:pageId',
        loader: ({ params }) => {
          return redirect(`/workspace/${params.workspaceId}/${params.pageId}`);
        },
      },
      {
        path: '/404',
        lazy: () => import('./pages/404'),
      },
      {
        path: '/auth/:authType',
        lazy: () => import('./pages/auth'),
      },
      {
        path: '/sign-in',
        lazy: () => import('./pages/sign-in'),
      },
      {
        path: '/redirect-proxy',
        lazy: () => import('@affine/core/pages/redirect'),
      },
      {
        path: '*',
        lazy: () => import('./pages/404'),
      },
    ],
  },
] satisfies [RouteObject, ...RouteObject[]];

export const viewRoutes = [
  {
    path: '/home',
    Component: Home,
  },
  {
    path: '/search',
    Component: Search,
  },
  {
    path: '/all',
    Component: All,
  },
  {
    path: '/collection',
    // lazy: () => import('./pages/workspace/collection/index'),
    Component: Collection,
  },
  {
    path: '/collection/:collectionId',
    // lazy: () => import('./pages/workspace/collection/detail'),
    Component: CollectionDetail,
  },
  {
    path: '/tag',
    // lazy: () => import('./pages/workspace/tag/index'),
    Component: Tag,
  },
  {
    path: '/tag/:tagId',
    // lazy: () => import('./pages/workspace/tag/detail'),
    Component: TagDetail,
  },
  {
    path: '/trash',
    lazy: () => import('./pages/workspace/trash'),
  },
  {
    path: '/:pageId',
    lazy: () => import('./pages/workspace/detail/mobile-detail-page'),
  },
  {
    path: '*',
    lazy: () => import('./pages/404'),
  },
] satisfies [RouteObject, ...RouteObject[]];

const createBrowserRouter = wrapCreateBrowserRouter(
  reactRouterCreateBrowserRouter
);
export const router = (
  window.SENTRY_RELEASE ? createBrowserRouter : reactRouterCreateBrowserRouter
)(topLevelRoutes, {
  future: {
    v7_normalizeFormMethod: true,
  },
});
