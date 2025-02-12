import { pageContainer } from "@/app/classnames"
import PostForm from "@/components/custom/postForm"

const NewPostPage = () => {

    return (
        <div className={pageContainer}>
            <h1>Nueva Publicación</h1>
            <PostForm></PostForm>
        </div>
    )
}

export default NewPostPage


