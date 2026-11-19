import React, { useCallback, useMemo, useState } from 'react';
import type { SidebarRouteKind } from '../../components/Sidebar';
import { SearchPanel } from './SearchScreen';

export function useSidebarSearch(navigation: any, isDesktop: boolean) {
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);

  const closeSearchPanel = useCallback(() => {
    setSearchPanelOpen(false);
  }, []);

  const onNavigate = useCallback(
    (route: string, _kind: SidebarRouteKind) => {
      if (isDesktop && route === 'Search') {
        setSearchPanelOpen((open) => !open);
        return;
      }

      setSearchPanelOpen(false);
      navigation?.navigate(route);
    },
    [isDesktop, navigation]
  );

  const searchPanelContent = useMemo(
    () =>
      searchPanelOpen ? (
        <SearchPanel navigation={navigation} onClose={closeSearchPanel} />
      ) : null,
    [closeSearchPanel, navigation, searchPanelOpen]
  );

  return {
    searchPanelOpen,
    searchPanelContent,
    onNavigate,
    closeSearchPanel,
  };
}
