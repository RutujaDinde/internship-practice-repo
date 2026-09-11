/* =====================================================
   AUTH FETCH
===================================================== */

async function authFetch(url, options = {}) {

    const requestOptions = {
        ...options,
        credentials: "include",
        headers: {
            ...(options.headers || {})
        }
    };


    let response =
        await fetch(
            url,
            requestOptions
        );


    /*
     * If access token expired,
     * try refreshing it once.
     */

    if (response.status === 401) {

        try {

            const refreshResponse =
                await fetch(
                    "/auth/refresh",
                    {
                        method: "POST",
                        credentials: "include"
                    }
                );


            if (refreshResponse.ok) {

                response =
                    await fetch(
                        url,
                        requestOptions
                    );

            }

        } catch (error) {

            console.error(
                "TOKEN REFRESH ERROR:",
                error
            );

        }

    }


    return response;

}