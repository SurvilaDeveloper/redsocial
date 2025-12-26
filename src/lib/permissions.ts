function canView({
    visibility,
    isLogged,
    isFriend,
    isFollower,
}: {
    visibility: number
    isLogged: boolean
    isFriend: boolean
    isFollower: boolean
}) {
    switch (visibility) {
        case 1:
            return true
        case 2:
            return isLogged
        case 3:
            return isLogged && (isFriend || isFollower)
        case 4:
            return isFriend
        default:
            return false
    }
}
export { canView };