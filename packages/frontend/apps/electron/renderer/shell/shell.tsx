import { ShellAppFallback } from '@affine/core/components/affine/app-container';
import { useAppSettingHelper } from '@affine/core/components/hooks/affine/use-app-setting-helper';
import { AppTabsHeader } from '@affine/core/modules/app-tabs-header';
import { SplitViewFallback } from '@affine/core/modules/workbench/view/split-view/split-view';

import * as styles from './shell.css';

export function ShellRoot() {
  const { appSettings } = useAppSettingHelper();
  const translucent =
    BUILD_CONFIG.isElectron &&
    environment.isMacOs &&
    appSettings.enableBlurBackground;
  return (
    <div className={styles.root} data-translucent={translucent}>
      <AppTabsHeader mode="shell" className={styles.appTabsHeader} />
      <ShellAppFallback className={styles.fallbackRoot}>
        <SplitViewFallback className={styles.splitViewFallback} />
      </ShellAppFallback>
    </div>
  );
}
