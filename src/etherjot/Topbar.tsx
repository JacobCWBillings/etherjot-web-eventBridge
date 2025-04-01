// src/etherjot/Topbar.tsx
import Swal from 'sweetalert2';
import { DEFAULT_CONTENT } from './Constants';
import { Row } from './Row';
import { SquareImage } from './SquareImage';
import './Topbar.css';
import { GlobalState } from './libetherjot';

interface Props {
    setTab?: (tab: string) => void  // Made optional since it may not be used in all implementations
    setShowAssetBrowser: (show: boolean) => void
    articleContent: string
    globalState: GlobalState
    isBeeRunning: boolean
    hasPostageStamp: boolean
    isWalletConnected: boolean
    walletAddress?: string
    onNewPost: () => void
}

export function Topbar({ 
    setTab, 
    setShowAssetBrowser, 
    articleContent, 
    globalState, 
    isBeeRunning, 
    hasPostageStamp,
    isWalletConnected,
    walletAddress = '',
    onNewPost
}: Props) {
    async function onSettings() {
        if (articleContent !== DEFAULT_CONTENT) {
            const confirmed = await Swal.fire({
                title: 'Are you sure?',
                text: 'You will lose unsaved changes',
                showCancelButton: true
            });
            if (!confirmed.isConfirmed) {
                return;
            }
        }
        // If setTab is provided, use it, otherwise just show asset browser
        if (setTab) {
            setTab('global-settings');
        } else {
            setShowAssetBrowser(true);
        }
    }

    return (
        <div className="topbar">
            <div>
                <button onClick={onSettings}>Settings</button>
                <button onClick={() => setShowAssetBrowser(true)} style={{ marginLeft: '8px' }}>
                    Asset Browser
                </button>
                <button onClick={onNewPost} style={{ marginLeft: '8px' }}>
                    New Post
                </button>
            </div>
            <div>
                <label>Swarm Hash</label>
                <input type="text" value={globalState.feed} readOnly />
                {globalState.feed && (
                    <a href={`http://localhost:1633/bzz/${globalState.feed}/`} target="_blank" rel="noreferrer">
                        Open
                    </a>
                )}
            </div>
            <div>
                <Row gap={16}>
                    <Row gap={4}>
                        <label>Bee</label>
                        <SquareImage size={32} src={isBeeRunning ? '/etherjot/yes.png' : '/etherjot/no.png'} />
                    </Row>
                    <Row gap={4}>
                        <label>Stamp</label>
                        <SquareImage size={32} src={hasPostageStamp ? '/etherjot/yes.png' : '/etherjot/no.png'} />
                    </Row>
                    <Row gap={4}>
                        <label>Wallet</label>
                        <SquareImage 
                            size={32} 
                            src={isWalletConnected ? '/etherjot/yes.png' : '/etherjot/no.png'} 
                        />
                        {isWalletConnected && walletAddress && (
                            <span style={{ marginLeft: '8px', fontSize: '12px' }}>
                                {walletAddress.substring(0, 6)}...{walletAddress.substring(walletAddress.length - 4)}
                            </span>
                        )}
                    </Row>
                </Row>
            </div>
        </div>
    );
}