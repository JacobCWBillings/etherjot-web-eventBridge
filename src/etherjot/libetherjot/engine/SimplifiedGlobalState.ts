// src/etherjot/libetherjot/engine/SimplifiedGlobalState.ts
import { Objects, Types } from 'cafe-utility';
import { Wallet, ethers } from 'ethers';
import { Swarm } from '../../libswarm';

export interface Asset {
    name: string;
    contentType: string;
    reference: string;
}

// Simplified article interface focused on metadata only
export interface Article {
    title: string;
    preview: string;
    markdownReference: string;  // Reference to raw markdown in Swarm
    category: string;
    tags: string[];
    createdAt: number;
    authorAddress: string;
    bannerReference?: string;   // Optional reference to banner image in Swarm
    // Proposal tracking fields
    proposalId?: string;
    proposalStatus?: 'pending' | 'approved' | 'rejected';
    proposalSubmittedAt?: number;
}

export interface GlobalStateOnDisk {
    beeApi: string;
    postageBatchId: string;
    privateKey: string;
    articles: Article[];
    assets: Asset[];
}

export interface GlobalState {
    beeApi: string;
    postageBatchId: string;
    swarm: Swarm;
    wallet: Wallet;
    articles: Article[];
    assets: Asset[];
}

// Helper function to ensure proposalStatus is of the correct type
function parseProposalStatus(status: any): 'pending' | 'approved' | 'rejected' | undefined {
    if (!status) return undefined;
    
    const statusStr = String(status).toLowerCase();
    
    if (statusStr === 'pending' || statusStr === 'approved' || statusStr === 'rejected') {
        return statusStr as 'pending' | 'approved' | 'rejected';
    }
    
    return undefined;
}

export async function getGlobalState(json: Record<string, any>): Promise<GlobalState> {
    const globalStateOnDisk: GlobalStateOnDisk = {
        privateKey: Types.asString(json.privateKey),
        beeApi: Types.asString(json.beeApi),
        postageBatchId: Types.asEmptiableString(json.postageBatchId),
        articles: Types.asArray(json.articles || []).map((x: any) => ({
            title: Types.asString(x.title),
            preview: Types.asString(x.preview),
            markdownReference: Types.asString(x.markdownReference),
            category: Types.asString(x.category),
            tags: Types.asArray(x.tags || []).map(t => Types.asString(t)),
            createdAt: Types.asNumber(x.createdAt),
            authorAddress: Types.asEmptiableString(x.authorAddress || ''),
            bannerReference: Types.asEmptiableString(x.bannerReference),
            // Handle proposal fields with proper type checking
            proposalId: Types.asEmptiableString(x.proposalId),
            proposalStatus: parseProposalStatus(x.proposalStatus),
            proposalSubmittedAt: x.proposalSubmittedAt ? Types.asNumber(x.proposalSubmittedAt) : undefined
        })),
        assets: Types.asArray(json.assets || []).map((x: any) => ({
            name: Types.asString(x.name),
            contentType: Types.asString(x.contentType),
            reference: Types.asString(x.reference)
        }))
    };
    return createGlobalState(globalStateOnDisk);
}

export async function saveGlobalState(globalState: GlobalState): Promise<GlobalStateOnDisk> {
    const globalStateOnDisk: GlobalStateOnDisk = {
        beeApi: globalState.beeApi,
        postageBatchId: globalState.postageBatchId,
        privateKey: globalState.wallet.privateKey,
        articles: globalState.articles,
        assets: globalState.assets
    };
    return globalStateOnDisk;
}

interface DefaultStateParams {
    beeApi?: string;
    postageBatchId?: string;
}

export async function createDefaultGlobalState(
    websiteName: string,
    params?: DefaultStateParams
): Promise<GlobalStateOnDisk> {
    const beeApi = params?.beeApi || 'http://localhost:1633';
    const postageBatchId = params?.postageBatchId || '';
    const swarm = new Swarm({
        beeApi,
        postageBatchId
    });
    const wallet = ethers.Wallet.createRandom();
    
    const globalStateOnDisk: GlobalStateOnDisk = {
        beeApi,
        postageBatchId,
        privateKey: wallet.privateKey,
        articles: [],
        assets: []
    };
    
    return globalStateOnDisk;
}

function createGlobalState(globalStateOnDisk: GlobalStateOnDisk): GlobalState {
    const globalState: GlobalState = {
        beeApi: globalStateOnDisk.beeApi,
        postageBatchId: globalStateOnDisk.postageBatchId,
        swarm: new Swarm({
            beeApi: globalStateOnDisk.beeApi,
            postageBatchId: globalStateOnDisk.postageBatchId || undefined
        }),
        wallet: new ethers.Wallet(
            globalStateOnDisk.privateKey.startsWith('0x')
                ? globalStateOnDisk.privateKey.slice(2)
                : globalStateOnDisk.privateKey
        ),
        articles: globalStateOnDisk.articles,
        assets: globalStateOnDisk.assets
    };
    return globalState;
}