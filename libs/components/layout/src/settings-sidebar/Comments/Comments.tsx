import { styled } from '@toeverything/components/ui';
import { useComments } from './use-comments';
import { CommentItem } from './CommentItem';

type CommentsProps = {
    activeCommentId: string;
    resolveComment: (blockId: string, commentId: string) => void;
};

export const Comments = ({
    activeCommentId,
    resolveComment,
}: CommentsProps) => {
    const { comments } = useComments();

    return (
        <StyledContainerForComments className="id-comments-panel">
            {comments?.map(comment => {
                return (
                    <CommentItem
                        {...comment}
                        activeCommentId={activeCommentId}
                        resolveComment={resolveComment}
                        key={comment.id}
                    />
                );
            })}
        </StyledContainerForComments>
    );
};

const StyledContainerForComments = styled('div')(({ theme }) => {
    return {
        position: 'relative',
    };
});
