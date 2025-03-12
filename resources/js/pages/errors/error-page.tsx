import { Head } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import type { BreadcrumbItem } from "@/types";

interface ErrorPageProps {
    status: number;
    customTitle?: string;
    customDescription?: string;
    customBreadcrumbs?: BreadcrumbItem[];
}

export default function ErrorPage({ status, customTitle, customDescription, customBreadcrumbs }: ErrorPageProps) {
    const defaultTitles = {
        403: 'Forbidden',
        404: 'Page Not Found',
        408: 'Request Timeout',
        423: 'Resource Locked',
        429: 'Too Many Requests',
        500: 'Server Error',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout'
    }[status] || 'Error';

    const defaultDescriptions = {
        403: 'Sorry, you don\'t have permission to access this page.',
        404: 'Sorry, we couldn\'t find the page you\'re looking for.',
        408: 'The server timed out waiting for the request.',
        423: 'The requested resource is currently locked and unavailable for access. Please try again later.',
        429: 'Too many requests. Please try again later.',
        500: 'Oops! Something went wrong on our servers.',
        502: 'The server received an invalid response from upstream.',
        503: 'Sorry, we\'re doing some maintenance. Please check back soon.',
        504: 'The server timed out waiting for the upstream response.'
    }[status] || 'An error occurred.';

    const title = customTitle ?? defaultTitles

    const description = customDescription ?? defaultDescriptions

    const breadcrumbs: BreadcrumbItem[] = customBreadcrumbs ?? [
        {
            title: title,
            href: route('dashboard'),
        }
    ];

    const handleBack = () => {
        window.history.back();
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${status}`} />

            <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] p-8">
                <div className="max-w-2xl text-center space-y-8">
                    <h1 className="text-[12rem] leading-none font-black text-foreground">
                        {status}
                    </h1>

                    <h2 className="text-4xl font-bold tracking-tight text-foreground">
                        {title}
                    </h2>

                    <p className="text-xl text-foreground/80">
                        {description}
                    </p>

                    <div className="flex items-center justify-center gap-4 pt-4">
                        <Button size="lg" onClick={handleBack}>
                            Go Back
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link href={route('dashboard')}>
                                Go to Dashboard
                            </Link>
                        </Button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
