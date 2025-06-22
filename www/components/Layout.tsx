import React from 'react';

interface LayoutProps {
    title: string;
    description?: string;
    children: React.ReactNode;
}

function Layout({
    title,
    description = 'Watch YouTube videos together with friends in real-time',
    children,
}: LayoutProps) {
    // Update document title
    React.useEffect(() => {
        document.title = title;

        // Update meta description
        const metaDescription = document.querySelector('meta[name="description"]');
        if (metaDescription) {
            metaDescription.setAttribute('content', description);
        }
    }, [title, description]);

    return <>{children}</>;
}

export default Layout;
