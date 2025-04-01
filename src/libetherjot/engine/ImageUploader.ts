import { GlobalState } from './GlobalState'

interface UploadedFile {
    reference: string
    path: string
}

export async function uploadImage(globalState: GlobalState, path: string, buffer: Buffer): Promise<UploadedFile> {
    const uint8Array = new Uint8Array(buffer);
    const hash = await (await globalState.swarm.newRawData(uint8Array, 'image/png')).save()
    return {
        reference: hash,
        path
    }
}
