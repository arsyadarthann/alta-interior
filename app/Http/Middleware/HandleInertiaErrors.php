<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class HandleInertiaErrors
{
    public function handle(Request $request, Closure $next)
    {
        try {
            $response = $next($request);

            if (in_array($response->status(), [403, 404, 408, 423, 429, 502, 503, 504])) {
                return Inertia::render('errors/error-page', [
                    'status' => $response->status(),
                ])->toResponse($request);
            }

            return $response;

        } catch (\Throwable $e) {
            $statusCode = $e instanceof HttpExceptionInterface
                ? $e->getStatusCode()
                : 500;

            return Inertia::render('errors/error-page', [
                'status' => $statusCode,
            ])->toResponse($request)
                ->setStatusCode($statusCode);
        }
    }
}
