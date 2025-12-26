const sp = {
    acceder: "Acceder",
    salir: "salir",
    inicio: "Página de Inicio",
    panel: "Panel",
    adminmessage: "Debes loguearte con una cuenta de administrador",
    tologmessage: "Debes estar autenticado/a para publicar.",
    createNewAccount: "Crear una cuenta nueva",
    initWithGoogle: "Iniciar sesión con Google",
    editProfile: "Editar perfil",
    editAccount: "Editar cuenta",
    changeAccount: "Cambiar de cuenta",
    newPost: "Nueva publicación",
    myWall: "Mi muro",
    search: "Buscar",
    tokenExpired: "El token enviado al email ha expirado",
}

const en = {
    acceder: "Login",
    salir: "Logout",
    inicio: "Home",
    panel: "Dashboard",
    adminmessage: "You must log in with an administrator account",
    tologmessage: "You must be logged in to post.",
    createNewAccount: "Create a new account",
    initWithGoogle: "Signin with Google",
    editProfile: "Edit profile",
    editAccount: "Edit account",
    changeAccount: "Switch account",
    newPost: "New post",
    myWall: "My wall",
    search: "Search",
    tokenExpired: "The token sent to the email has expired",
}

const texts = (language: string) => {
    if (language === "sp") {
        return sp
    } else {
        return en
    }
}

export { texts }