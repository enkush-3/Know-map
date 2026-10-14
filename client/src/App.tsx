import React from 'react';
import { WorkspaceHeader } from './components/layout/WorkspaceHeader';
import { ResizableSplitView } from './components/layout/ResizableSplitView';
import { ChatContainer } from './components/chat/ChatContainer';
import { KnowledgeGraphCanvas } from './components/canvas/KnowledgeGraphCanvas';

export const App: React.FC = () => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'var(--bg-canvas)',
      }}
    >
      <WorkspaceHeader />
      <ResizableSplitView
        leftPane={<ChatContainer />}
        rightPane={<KnowledgeGraphCanvas />}
      />
    </div>
  );
};

export default App;
