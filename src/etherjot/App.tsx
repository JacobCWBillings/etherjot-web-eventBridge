// src/etherjot/App.tsx
import { useEffect, useState } from 'react';
import { useWeb3Context } from '../context/Web3Provider';
import './App.css';
import { DEFAULT_CONTENT } from './Constants';
import { NewPostPage } from './NewPostPage';
import { Topbar } from './Topbar';
import { AssetBrowser } from './asset-browser/AssetBrowser';
import { Article, GlobalState, getGlobalState } from './libetherjot/engine/SimplifiedGlobalState';
import { Bee } from '@ethersphere/bee-js';
import { Dates } from 'cafe-utility';
import { ArticleSaver } from '../services/ArticleSaver';
import { directPublicationService } from '../services/DirectPublicationService';
import { BlogPostStatus } from '../components/BlogPostStatus';

console.log('console log Hello from /src/etherjot/App.tsx at line 16')

// Create a simplified topbar-compatible GlobalState adapter
const createCompatibleGlobalState = (simpleState: GlobalState): any => {
  return {
    ...simpleState,
    configuration: {
      title: "DAO Blog Platform",
      header: { 
        title: "DAO Blog",
        logo: "",
        description: "A decentralized blog platform with DAO governance",
        linkLabel: "Governance",
        linkAddress: "/governance.html"
      },
      main: { highlight: "Featured" },
      footer: {
        description: "Powered by Swarm and Q Blockchain",
        links: { discord: "", twitter: "", github: "", youtube: "", reddit: "" }
      },
      extensions: { ethereumAddress: "", donations: false, comments: false }
    },
    feed: simpleState.postageBatchId || "",
    pages: [],
    collections: {}
  };
};

function App() {
  // Use web3 context for wallet integration
  const { address, isConnected } = useWeb3Context();
  
  const [globalState, setGlobalState] = useState<GlobalState | null>(null);
  const [isBeeRunning, setBeeRunning] = useState(false);
  const [hasPostageStamp, setHasPostageStamp] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState(DEFAULT_CONTENT);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [showAssetBrowser, setShowAssetBrowser] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedState = localStorage.getItem('state');
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      getGlobalState(parsedState).then(setGlobalState);
    }
  }, []);

  async function checkBee() {
    fetch('http://localhost:1633/addresses')
      .then(async () => {
        if (!isBeeRunning) {
          setBeeRunning(true);
        }
        const bee = new Bee('http://localhost:1633');
        const stamps = await bee.getAllPostageBatch();
        if (stamps.some(x => x.usable)) {
          if (!hasPostageStamp) {
            setHasPostageStamp(true);
          }
        } else {
          setHasPostageStamp(false);
        }
      })
      .catch(() => {
        setBeeRunning(false);
        setHasPostageStamp(false);
      });
  }

  useEffect(() => {
    checkBee();
    const interval = setInterval(() => {
      checkBee();
    }, Dates.seconds(5));
    return () => clearInterval(interval);
  }, []);

  function insertAsset(reference: string) {
    setArticleContent((y: string) => `${y}\n\n![img alt here](http://localhost:1633/bytes/${reference})`);
    setShowAssetBrowser(false);
  }
  
  const handleProposalSubmitted = async (proposalId: string, markdownReference: string) => {
    if (!globalState) return;
    
    try {
      // Create article metadata
      const article = directPublicationService.prepareArticleMetadata(
        articleTitle,
        markdownReference,
        articleContent.substring(0, 150) + (articleContent.length > 150 ? '...' : ''),
        'General', // Default category
        [], // Default tags
        address || 'anonymous',
        undefined // No banner by default
      );
      
      // Add proposal ID
      article.proposalId = proposalId;
      
      // Save to global state
      const updatedState = await ArticleSaver.saveArticle(globalState, article);
      setGlobalState({...updatedState});
      
      // Set current article for status display
      setCurrentArticle(article);
      
      // Show success message
      setSuccessMessage('Your post has been submitted for DAO approval!');
      
      // Clear the message after 5 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
    } catch (error) {
      console.error('Failed to save article:', error);
    }
  };
  
  const handleNewPost = () => {
    setArticleTitle('');
    setArticleContent(DEFAULT_CONTENT);
    setCurrentArticle(null);
  };

  console.log(globalState)

  if (!globalState) {
    return <div>Loading...</div>;
  }

  // Create a compatible global state object for components that expect the original structure
  const compatibleGlobalState = createCompatibleGlobalState(globalState);

  return (
    <>
      {showAssetBrowser && (
        <AssetBrowser
          globalState={compatibleGlobalState}
          setGlobalState={(state) => {
            // Extract necessary data from the compatible state and update simplified state
            setGlobalState(prevState => {
              if (!prevState) return null;
              return {
                ...prevState,
                assets: state.assets
              };
            });
          }}
          setShowAssetBrowser={setShowAssetBrowser}
          insertAsset={insertAsset}
        />
      )}
      <Topbar
        setShowAssetBrowser={setShowAssetBrowser}
        articleContent={articleContent}
        globalState={compatibleGlobalState}
        isBeeRunning={isBeeRunning}
        hasPostageStamp={hasPostageStamp}
        isWalletConnected={isConnected}
        walletAddress={address}
        onNewPost={handleNewPost}
      />
      <main>
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        {currentArticle && (
          <div className="current-article-status">
            <BlogPostStatus article={currentArticle} />
            <button onClick={handleNewPost}>Create New Post</button>
          </div>
        )}
        
        {(!currentArticle || (currentArticle && currentArticle.proposalStatus === 'rejected')) && (
          <NewPostPage 
            articleContent={articleContent} 
            setArticleContent={setArticleContent}
            articleTitle={articleTitle}
            setArticleTitle={setArticleTitle}
            authorAddress={address || 'anonymous'}
            globalState={globalState}
            onProposalSubmitted={handleProposalSubmitted}
          />
        )}
      </main>
    </>
  );
}

export default App;