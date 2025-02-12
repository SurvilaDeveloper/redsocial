import LoginForm from '@/components/custom/loginForm';

const LoginPage = async ({
    searchParams,
}: {
    searchParams: Promise<{
        verified: string
        message: string
        emailsend: string
        expired: string
    }>;
}) => {

    const params = await searchParams; // Await the searchParams promise
    const isVerified = params.verified === 'true';
    const message = params.message;
    const emailsend = params.emailsend;
    const tokenExpired = params.expired;

    return (
        <div>
            <h1>Login</h1>

            <LoginForm
                isVerified={isVerified}
                message={message}
                emailsend={emailsend}
                tokenExpired={tokenExpired}
            />

        </div>
    );
};

export default LoginPage;
