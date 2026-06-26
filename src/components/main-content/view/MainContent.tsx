import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import ChatInterface from '../../chat/view/ChatInterface';
import FileTree from '../../file-tree/view/FileTree';
import StandaloneShell from '../../standalone-shell/view/StandaloneShell';
import GitPanel from '../../git-panel/view/GitPanel';
import PluginTabContent from '../../plugins/view/PluginTabContent';
import { BrowserUsePanel } from '../../browser-use';
import type { MainContentProps } from '../types/types';
import { useTaskMaster } from '../../../contexts/TaskMasterContext';
import { usePaletteOpsRegister } from '../../../contexts/PaletteOpsContext';
import { useTasksSettings } from '../../../contexts/TasksSettingsContext';
import { useUiPreferences } from '../../../hooks/useUiPreferences';
import { authenticatedFetch } from '../../../utils/api';
import { useEditorSidebar } from '../../code-editor/hooks/useEditorSidebar';
import EditorSidebar from '../../code-editor/view/EditorSidebar';
import type { Project } from '../../../types/app';
import { TaskMasterPanel } from '../../task-master';
import { usePlugins } from '../../../contexts/PluginsContext';
import { useSidePanel } from '../hooks/useSidePanel';

import MainContentHeader from './subcomponents/MainContentHeader';
import MainContentStateView from './subcomponents/MainContentStateView';
import ErrorBoundary from './ErrorBoundary';
import SidePanel from './SidePanel';

type TaskMasterContextValue = {
  currentProject?: Project | null;
  setCurrentProject?: ((project: Project) => void) | null;
};

type TasksSettingsContextValue = {
  tasksEnabled: boolean;
  isTaskMasterInstalled: boolean | null;
  isTaskMasterReady: boolean | null;
};

function MainContent({
  selectedProject,
  selectedSession,
  activeTab,
  sidePanel,
  setActiveTab,
  setSidePanel,
  ws,
  sendMessage,
  isMobile,
  onMenuClick,
  isLoading,
  onInputFocusChange,
  onSessionProcessing,
  onSessionIdle,
  processingSessions,
  onNavigateToSession,
  onSessionEstablished,
  onShowSettings,
  externalMessageUpdate,
  newSessionTrigger,
}: MainContentProps) {
  const { t } = useTranslation();
  const { plugins } = usePlugins();
  const { preferences } = useUiPreferences();
  const { autoExpandTools, showRawParameters, showThinking, autoScrollToBottom, sendByCtrlEnter } = preferences;

  const { currentProject, setCurrentProject } = useTaskMaster() as TaskMasterContextValue;
  const { tasksEnabled, isTaskMasterInstalled } = useTasksSettings() as TasksSettingsContextValue;
  const [browserUseEnabled, setBrowserUseEnabled] = React.useState(false);

  const shouldShowTasksTab = Boolean(tasksEnabled && isTaskMasterInstalled);
  const shouldShowBrowserTab = browserUseEnabled;

  const {
    editingFile,
    editorWidth,
    editorExpanded,
    resizeHandleRef,
    handleFileOpen,
    handleCloseEditor,
    handleToggleEditorExpand,
    handleResizeStart,
  } = useEditorSidebar({
    selectedProject,
    isMobile,
  });

  const {
    panelWidth,
    resizeHandleRef: sidePanelResizeHandleRef,
    handleResizeStart: handleSidePanelResizeStart,
  } = useSidePanel({ isMobile });

  const sidePanelTitle = useMemo(() => {
    if (!sidePanel) {
      return '';
    }

    if (sidePanel === 'files') {
      return t('mainContent.projectFiles');
    }

    if (sidePanel === 'git') {
      return t('tabs.git');
    }

    if (sidePanel === 'tasks') {
      return 'TaskMaster';
    }

    if (sidePanel === 'browser') {
      return t('tabs.browser');
    }

    if (sidePanel.startsWith('plugin:')) {
      const pluginName = sidePanel.replace('plugin:', '');
      return plugins.find((plugin) => plugin.name === pluginName)?.displayName ?? pluginName;
    }

    return '';
  }, [plugins, sidePanel, t]);

  useEffect(() => {
    const selectedProjectId = selectedProject?.projectId;
    const currentProjectId = currentProject?.projectId;

    if (selectedProject && selectedProjectId !== currentProjectId) {
      setCurrentProject?.(selectedProject);
    }
  }, [selectedProject, currentProject?.projectId, setCurrentProject]);

  useEffect(() => {
    if (!shouldShowTasksTab && sidePanel === 'tasks') {
      setSidePanel(null);
    }
  }, [shouldShowTasksTab, setSidePanel, sidePanel]);

  const loadBrowserUseSettings = useCallback(async () => {
    try {
      const response = await authenticatedFetch('/api/browser-use/settings');
      const data = await response.json();
      setBrowserUseEnabled(Boolean(response.ok && data?.success !== false && data?.data?.settings?.enabled));
    } catch {
      setBrowserUseEnabled(false);
    }
  }, []);

  useEffect(() => {
    void loadBrowserUseSettings();
    window.addEventListener('browserUseSettingsChanged', loadBrowserUseSettings);
    return () => window.removeEventListener('browserUseSettingsChanged', loadBrowserUseSettings);
  }, [loadBrowserUseSettings]);

  useEffect(() => {
    if (!shouldShowBrowserTab && sidePanel === 'browser') {
      setSidePanel(null);
    }
  }, [shouldShowBrowserTab, setSidePanel, sidePanel]);

  usePaletteOpsRegister({
    openFile: (filePath: string) => {
      setActiveTab('files');
      handleFileOpen(filePath);
    },
  });

  const renderSidePanelContent = () => {
    if (!sidePanel || !selectedProject) {
      return null;
    }

    if (sidePanel === 'files') {
      return (
        <FileTree
          selectedProject={selectedProject}
          onFileOpen={handleFileOpen}
          activeFilePath={editingFile?.path ?? null}
        />
      );
    }

    if (sidePanel === 'git') {
      return <GitPanel selectedProject={selectedProject} isMobile={isMobile} onFileOpen={handleFileOpen} />;
    }

    if (sidePanel === 'tasks' && shouldShowTasksTab) {
      return <TaskMasterPanel isVisible />;
    }

    if (sidePanel === 'browser' && shouldShowBrowserTab) {
      return <BrowserUsePanel isVisible onShowSettings={onShowSettings} />;
    }

    if (sidePanel.startsWith('plugin:')) {
      return (
        <PluginTabContent
          pluginName={sidePanel.replace('plugin:', '')}
          selectedProject={selectedProject}
          selectedSession={selectedSession}
        />
      );
    }

    return null;
  };

  if (isLoading) {
    return <MainContentStateView mode="loading" isMobile={isMobile} onMenuClick={onMenuClick} />;
  }

  if (!selectedProject) {
    return <MainContentStateView mode="empty" isMobile={isMobile} onMenuClick={onMenuClick} />;
  }

  return (
    <div className="flex h-full flex-col">
      <MainContentHeader
        activeTab={activeTab}
        sidePanel={sidePanel}
        setActiveTab={setActiveTab}
        selectedProject={selectedProject}
        selectedSession={selectedSession}
        shouldShowTasksTab={shouldShowTasksTab}
        shouldShowBrowserTab={shouldShowBrowserTab}
        isMobile={isMobile}
        onMenuClick={onMenuClick}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className={`flex min-h-0 min-w-[200px] flex-col overflow-hidden ${editorExpanded ? 'hidden' : ''} flex-1`}>
          <div className={`h-full ${activeTab === 'chat' ? 'block' : 'hidden'}`}>
            <ErrorBoundary showDetails>
              <ChatInterface
                selectedProject={selectedProject}
                selectedSession={selectedSession}
                ws={ws}
                sendMessage={sendMessage}
                onFileOpen={handleFileOpen}
                onInputFocusChange={onInputFocusChange}
                onSessionProcessing={onSessionProcessing}
                onSessionIdle={onSessionIdle}
                processingSessions={processingSessions}
                onNavigateToSession={onNavigateToSession}
                onSessionEstablished={onSessionEstablished}
                onShowSettings={onShowSettings}
                autoExpandTools={autoExpandTools}
                showRawParameters={showRawParameters}
                showThinking={showThinking}
                autoScrollToBottom={autoScrollToBottom}
                sendByCtrlEnter={sendByCtrlEnter}
                externalMessageUpdate={externalMessageUpdate}
                newSessionTrigger={newSessionTrigger}
                onShowAllTasks={tasksEnabled ? () => setActiveTab('tasks') : null}
              />
            </ErrorBoundary>
          </div>

          <div className={`h-full w-full overflow-hidden ${activeTab === 'shell' ? 'block' : 'hidden'}`}>
            <StandaloneShell
              project={selectedProject}
              session={selectedSession}
              showHeader={false}
              isActive={activeTab === 'shell'}
            />
          </div>
        </div>

        {sidePanel && (
          <SidePanel
            panel={sidePanel}
            isMobile={isMobile}
            panelWidth={panelWidth}
            resizeHandleRef={sidePanelResizeHandleRef}
            onResizeStart={handleSidePanelResizeStart}
            onClose={() => setSidePanel(null)}
            title={sidePanelTitle}
          >
            {renderSidePanelContent()}
          </SidePanel>
        )}

        <EditorSidebar
          editingFile={editingFile}
          isMobile={isMobile}
          editorExpanded={editorExpanded}
          editorWidth={editorWidth}
          resizeHandleRef={resizeHandleRef}
          onResizeStart={handleResizeStart}
          onCloseEditor={handleCloseEditor}
          onToggleEditorExpand={handleToggleEditorExpand}
          projectPath={selectedProject.path}
        />
      </div>
    </div>
  );
}

export default React.memo(MainContent);
