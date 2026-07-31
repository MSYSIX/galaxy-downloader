import type { AudioExtractTask } from '@/components/audio-tool/types';
import type { ResultKind, UnifiedParseResult } from '@/lib/types';

import { AudioResultPanel } from './AudioResultPanel';
import { ImageResultPanel } from './ImageResultPanel';
import { type MediaPreviewRequest } from './media-preview';
import { PodcastPickerPanel } from './PodcastPickerPanel';
import { hasSourceUrl } from './result-card-visibility';
import { VideoResultPanel } from './VideoResultPanel';

type ResultData = NonNullable<UnifiedParseResult['data']>;

function resolveResultKind(result: ResultData): ResultKind {
    if (result.kind) return result.kind;
    if (result.noteType === 'image' && Array.isArray(result.images) && result.images.length > 0) return 'image';
    if (result.episodes && result.episodes.length > 0) return 'picker';
    const hasVideo = hasSourceUrl(result.downloadVideoUrl) || hasSourceUrl(result.originDownloadVideoUrl);
    const hasAudio = hasSourceUrl(result.downloadAudioUrl) || hasSourceUrl(result.originDownloadAudioUrl);
    if (!hasVideo && hasAudio) return 'audio';
    return 'video';
}

interface ResultCardProps {
    result: UnifiedParseResult['data'] | null | undefined;
    onClose: () => void;
    onOpenExtractAudio: (task: AudioExtractTask) => void;
    onRequestPreview: (request: MediaPreviewRequest) => void;
    activePreview?: MediaPreviewRequest | null;
}

export function ResultCard({
    result,
    onClose,
    onOpenExtractAudio,
    onRequestPreview,
    activePreview,
}: ResultCardProps) {
    if (!result) return null;

    const kind = resolveResultKind(result);
    const panelProps = { result, onClose, onOpenExtractAudio, onRequestPreview, activePreview };

    if (kind === 'picker') return <PodcastPickerPanel {...panelProps} />;
    if (kind === 'audio') return <AudioResultPanel {...panelProps} />;
    if (kind === 'image') return <ImageResultPanel {...panelProps} />;
    return <VideoResultPanel {...panelProps} />;
}
