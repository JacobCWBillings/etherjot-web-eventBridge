// src/etherjot/NewPostPage.tsx
import MDEditor from '@uiw/react-md-editor';
import { useState } from 'react';
import { ProposalSubmission } from '../components/ProposalSubmission';
import { GlobalState } from './libetherjot/engine/SimplifiedGlobalState';
import './NewPostPage.css';

interface Props {
    articleContent: string;
    setArticleContent: (content: string) => void;
    articleTitle: string;
    setArticleTitle: (title: string) => void;
    authorAddress: string;
    globalState: GlobalState;
    onProposalSubmitted: (proposalId: string, markdownReference: string) => void;
}

export function NewPostPage({ 
    articleContent, 
    setArticleContent, 
    articleTitle, 
    setArticleTitle, 
    authorAddress,
    globalState,
    onProposalSubmitted 
}: Props) {
    const [showProposalSubmission, setShowProposalSubmission] = useState(false);

    const handleShowProposalSubmission = () => {
        setShowProposalSubmission(true);
    };

    const handleCancelProposalSubmission = () => {
        setShowProposalSubmission(false);
    };

    const handleSubmitProposalSuccess = (proposalId: string, markdownReference: string) => {
        setShowProposalSubmission(false);
        onProposalSubmitted(proposalId, markdownReference);
    };

    return (
        <div className="new-post-container">
            {!showProposalSubmission ? (
                <>
                    <div className="new-post-header">
                        <input 
                            type="text" 
                            className="post-title-input"
                            placeholder="Enter post title..."
                            value={articleTitle}
                            onChange={(e) => setArticleTitle(e.target.value)}
                        />
                        <button 
                            className="submit-proposal-button"
                            onClick={handleShowProposalSubmission}
                            disabled={!articleTitle || !articleContent}
                        >
                            Submit for DAO Approval
                        </button>
                    </div>
                    <MDEditor
                        value={articleContent}
                        onChange={x => setArticleContent(x || '')}
                        className="editor"
                        height="90vh"
                        data-color-mode="light"
                    />
                </>
            ) : (
                <ProposalSubmission 
                    title={articleTitle}
                    content={articleContent}
                    authorAddress={authorAddress}
                    globalState={globalState}
                    onSubmitSuccess={handleSubmitProposalSuccess}
                    onCancel={handleCancelProposalSubmission}
                />
            )}
        </div>
    );
}