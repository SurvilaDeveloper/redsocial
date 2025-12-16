import { pageContainer } from "@/app/classnames";
import { Post } from "@/components/custom/post";
import AsideLeft from "@/components/custom/asideleft";
import AsideRight from "@/components/custom/asideright";

interface ShowPostPageProps {
    searchParams: Promise<{ post_id?: string }>;
}

const ShowPostPage = async ({ searchParams }: ShowPostPageProps) => {
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

        <div className="flex flex-row w-full text-white bg-black">
            <AsideLeft> Aside Left Aside LeftAside LeftAside LeftAside LeftAside LeftAside LeftAside LeftAside LeftAside</AsideLeft>


            <div className="flex flex-col items-center w-[60%] pt-[40px]">
                <Post postId={parseInt(post_id)} />
            </div>

            <AsideRight> Aside Right </AsideRight>
        </div>
    );
}

export default ShowPostPage;
