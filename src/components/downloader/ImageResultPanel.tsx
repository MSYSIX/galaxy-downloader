import type { AudioExtractTask } from '@/components/audio-tool/types';
import { Card, CardContent } from '@/components/ui/card';
import type { UnifiedParseResult } from '@/lib/types';

import { ImageNoteGrid } from './ImageNoteGrid';
import { type MediaPreviewRequest } from './media-preview';
import { ResultCardHeader } from './ResultCardHeader';
import { resolveResultDisplayImages } from './result-card-visibility';

type ResultData = NonNullable<UnifiedParseResult['data']>;

interface ImageResultPanelProps {
    result: ResultData;
    onClose: () => void;
    onOpenExtractAudio: (task: AudioExtractTask) => void;
    onRequestPreview: (request: MediaPreviewRequest) => void;
    activePreview?: MediaPreviewRequest | null;
}

export function ImageResultPanel({ result, onClose }: ImageResultPanelProps) {
    const displayImages = resolveResultDisplayImages({
        noteType: result.noteType,
        images: result.images,
        coverUrl: result.cover,
    });

    return (
        <Card>
            <ResultCardHeader
                title={result.title}
                duration={result.duration}
                canSharePlayLink={false}
                onCopyShareLink={() => {}}
                onClose={onClose}
            />
            <CardContent className="px-3 pb-3 pt-0">
                <ImageNoteGrid images={displayImages} title={result.title} />
            </CardContent>
        </Card>
    );
}
