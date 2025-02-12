import { pageContainer } from "@/app/classnames";
import { PostEdit } from "@/components/custom/postEdit";

interface ShowPostPageProps {
    searchParams: Promise<{ post_id?: string }>;
}

const EditPostPage = async ({ searchParams }: ShowPostPageProps) => {
    const post_id = (await searchParams).post_id;
    console.log("post_id en showpost/page.tsx: ", post_id);

    if (!post_id) {
        return <div>Post ID is missing</div>;
    }

    //const res = await fetch(`/api/post?post_id=${post_id}`);
    //const data = await res.json();

    //if (!data.post) {
    //   return <div>Post not found</div>;
    //}

    return (
        <div className={pageContainer}>
            <h1>Post Editor</h1>

            <PostEdit postId={parseInt(post_id)} />
        </div>
    );
}

export default EditPostPage;