interface Post {
    title: string;
    description: string;
    image?: string;
    imagenumber: number;
    id: number;
    createdAt: string;
    relations: { following: boolean, isFollower: boolean, isFriend: boolean }
    userData?: { id: number, name: string, imageUrl: string, imagePublicId: string };
    active: number;
    visibility: number;
    images?: {
        imageUrl: string,
        imagePublicId: string,
        index: number,
        post_user_id: number,
        post_id: number,
        id: number
    }[]
}