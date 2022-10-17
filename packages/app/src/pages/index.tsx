import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import { styled, useTheme } from '@/styles';
import { Header } from '@/components/Header';
import { FAQ } from '@/components/faq';
import '@/components/simple-counter';

const StyledEditorContainer = styled('div')(({ theme }) => {
  return {
    flexGrow: 1,
    paddingTop: '78px',
  };
});

const StyledPage = styled('div')({
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'var(--page-background-color)',
  transition: 'background-color .5s',
});

const DynamicEditor = dynamic(() => import('../components/editor'), {
  loading: () => <div>Loading...</div>,
  ssr: false,
});

const Home: NextPage = () => {
  return (
    <StyledPage>
      <Header />
      <StyledEditorContainer>
        <DynamicEditor />
      </StyledEditorContainer>
      {/*<Button>A button use the theme styles</Button>*/}
      {/*<simple-counter name="A counter created by web component" />*/}
      {/*<p>current mode {mode}</p>*/}
      {/*<button*/}
      {/*  onClick={() => {*/}
      {/*    changeMode('light');*/}
      {/*  }}*/}
      {/*>*/}
      {/*  light*/}
      {/*</button>*/}
      {/*<button*/}
      {/*  onClick={() => {*/}
      {/*    changeMode('dark');*/}
      {/*  }}*/}
      {/*>*/}
      {/*  dark*/}
      {/*</button>*/}
      {/*<button*/}
      {/*  onClick={() => {*/}
      {/*    changeMode('auto');*/}
      {/*  }}*/}
      {/*>*/}
      {/*  auto*/}
      {/*</button>*/}
      <FAQ />
    </StyledPage>
  );
};

export default Home;
