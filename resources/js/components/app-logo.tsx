import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex items-center justify-center w-full">
                <AppLogoIcon className="h-10 w-auto" />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-none font-semibold">Aliansi 1955</span>
            </div>
        </>
    );
}
