import { useCallback, useEffect, useState, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTranslation } from "react-i18next";
import { authenticatedFetch } from "../../../utils/api";
import { ReleaseInfo } from "../../../types/sharedTypes";
import { copyTextToClipboard } from "../../../utils/clipboard";
import type { InstallMode } from "../../../hooks/useVersionCheck";
import { useDesktopUpdater } from "../../../hooks/useDesktopUpdater";
import { IS_PLATFORM } from "../../../constants/config";

interface VersionUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    releaseInfo: ReleaseInfo | null;
    currentVersion: string;
    latestVersion: string | null;
    installMode: InstallMode;
}

const RELOAD_COUNTDOWN_START = 30;

export function VersionUpgradeModal({
    isOpen,
    onClose,
    releaseInfo,
    currentVersion,
    latestVersion,
    installMode
}: VersionUpgradeModalProps) {
    const { t } = useTranslation('common');
    const isDesktop = installMode === 'desktop';
    const {
        downloadProgress,
        updateDownloaded,
        updateError: desktopUpdateError,
        downloadUpdate,
        installUpdate,
    } = useDesktopUpdater();
    const upgradeCommand = installMode === 'npm'
        ? t('versionUpdate.npmUpgradeCommand')
        : IS_PLATFORM
            ? 'npm run update:platform'
            : 'git checkout main && git pull && npm install';
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateOutput, setUpdateOutput] = useState('');
    const [updateError, setUpdateError] = useState('');
    const [reloadCountdown, setReloadCountdown] = useState<number | null>(null);
    const displayedLatestVersion = latestVersion ?? updateDownloaded?.version ?? null;
    const combinedError = updateError || desktopUpdateError || '';

    useEffect(() => {
        if (!IS_PLATFORM || reloadCountdown === null || reloadCountdown <= 0) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setReloadCountdown((previousCountdown) => {
                if (previousCountdown === null) {
                    return null;
                }

                return Math.max(previousCountdown - 1, 0);
            });
        }, 1000);

        return () => window.clearTimeout(timeoutId);
    }, [reloadCountdown]);

    const handleUpdateNow = useCallback(async () => {
        setIsUpdating(true);
        setUpdateError('');

        if (isDesktop) {
            try {
                await downloadUpdate();
            } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Update failed';
                setUpdateError(message);
            } finally {
                setIsUpdating(false);
            }
            return;
        }

        setUpdateOutput('Starting update...\n');
        setReloadCountdown(IS_PLATFORM ? RELOAD_COUNTDOWN_START : null);

        try {
            const response = await authenticatedFetch('/api/system/update', {
                method: 'POST',
            });

            const data = await response.json();

            if (response.ok) {
                setUpdateOutput(prev => prev + data.output + '\n');
                setUpdateOutput(prev => prev + '\n✅ Update completed successfully!\n');
                setUpdateOutput(prev => prev + 'Please restart the server to apply changes.' + '\n');
            } else {
                setUpdateError(data.error || 'Update failed');
                setUpdateOutput(prev => prev + '\n❌ Update failed: ' + (data.error || 'Unknown error') + '\n');
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Update failed';
            setUpdateError(message);
            setUpdateOutput(prev => prev + '\n❌ Update failed: ' + message + '\n');
        } finally {
            setIsUpdating(false);
        }
    }, [downloadUpdate, isDesktop]);

    const handleInstallUpdate = useCallback(async () => {
        if (!isDesktop) {
            return;
        }

        try {
            await installUpdate();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Install failed';
            setUpdateError(message);
        }
    }, [installUpdate, isDesktop]);

    if (!isOpen) return null;

    const showManualUpgrade = !isDesktop && !isUpdating && !updateOutput;
    const showDesktopProgress = isDesktop && (isUpdating || downloadProgress !== null);
    const showServerOutput = !isDesktop && (updateOutput || combinedError);
    const showRestartButton = isDesktop && updateDownloaded !== null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <button
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-label={t('versionUpdate.ariaLabels.closeModal')}
            />

            <div className="relative mx-4 max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-lg border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('versionUpdate.title')}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {releaseInfo?.title || t('versionUpdate.newVersionReady')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700/50">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('versionUpdate.currentVersion')}</span>
                        <span className="font-mono text-sm text-gray-900 dark:text-white">{currentVersion}</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-700 dark:bg-blue-900/20">
                        <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{t('versionUpdate.latestVersion')}</span>
                        <span className="font-mono text-sm text-blue-900 dark:text-blue-100">{displayedLatestVersion}</span>
                    </div>
                </div>

                {releaseInfo?.body && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('versionUpdate.whatsNew')}</h3>
                            {releaseInfo?.htmlUrl && (
                                <a
                                    href={releaseInfo.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                                >
                                    {t('versionUpdate.viewFullRelease')}
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-600 dark:bg-gray-700/50">
                            <div className="prose prose-sm max-w-none text-sm text-gray-700 dark:prose-invert dark:text-gray-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]} components={changelogComponents}>
                                    {cleanChangelog(releaseInfo.body)}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                )}

                {showDesktopProgress && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('versionUpdate.updateProgress')}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{t('versionUpdate.desktopUpdatingHint')}</p>
                        <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div
                                className="h-full rounded-full bg-blue-600 transition-all duration-200"
                                style={{ width: `${Math.max(0, Math.min(100, downloadProgress?.percent ?? 0))}%` }}
                            />
                        </div>
                        {downloadProgress && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {t('versionUpdate.desktopDownloadProgress', { percent: Math.round(downloadProgress.percent) })}
                            </p>
                        )}
                    </div>
                )}

                {showServerOutput && (
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('versionUpdate.updateProgress')}</h3>
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 p-4 dark:bg-gray-950">
                            <pre className="whitespace-pre-wrap font-mono text-xs text-green-400">{updateOutput}</pre>
                        </div>
                        {IS_PLATFORM && reloadCountdown !== null && (
                            <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-200">
                                {reloadCountdown === 0
                                    ? 'Refresh the page now. If that doesn\'t work, RESTART the environment.'
                                    : `Refresh the page in ${reloadCountdown} ${reloadCountdown === 1 ? 'second' : 'seconds'}. If that doesn\'t work, RESTART the environment.`}
                            </div>
                        )}
                    </div>
                )}

                {combinedError && (
                    <div className="space-y-2">
                        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-200">
                            {combinedError}
                        </div>
                        {isDesktop && releaseInfo?.htmlUrl && (
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                {t('versionUpdate.desktopDebFallback')}{' '}
                                <a
                                    href={releaseInfo.htmlUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline dark:text-blue-400"
                                >
                                    {t('versionUpdate.viewFullRelease')}
                                </a>
                            </p>
                        )}
                    </div>
                )}

                {isDesktop && updateDownloaded && (
                    <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-200">
                        {t('versionUpdate.desktopRestartToInstall', { version: updateDownloaded.version })}
                    </div>
                )}

                {showManualUpgrade && (
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">{t('versionUpdate.manualUpgrade')}</h3>
                        <div className="rounded-lg border bg-gray-100 p-3 dark:bg-gray-800">
                            <code className="font-mono text-sm text-gray-800 dark:text-gray-200">
                                {upgradeCommand}
                            </code>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                            {t('versionUpdate.manualUpgradeHint')}
                        </p>
                    </div>
                )}

                {isDesktop && !showManualUpgrade && !showRestartButton && !showDesktopProgress && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t('versionUpdate.desktopUpdatingHint')}
                    </p>
                )}

                <div className="flex gap-2 pt-2">
                    <button
                        onClick={onClose}
                        className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                    >
                        {updateOutput || showRestartButton ? t('versionUpdate.buttons.close') : t('versionUpdate.buttons.later')}
                    </button>
                    {!updateOutput && !showRestartButton && (
                        <>
                            {!isDesktop && (
                                <button
                                    onClick={() => copyTextToClipboard(upgradeCommand)}
                                    className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                                >
                                    {t('versionUpdate.buttons.copyCommand')}
                                </button>
                            )}
                            <button
                                onClick={handleUpdateNow}
                                disabled={isUpdating}
                                className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        {t('versionUpdate.buttons.updating')}
                                    </>
                                ) : (
                                    t('versionUpdate.buttons.updateNow')
                                )}
                            </button>
                        </>
                    )}
                    {showRestartButton && (
                        <button
                            onClick={handleInstallUpdate}
                            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                        >
                            {t('versionUpdate.buttons.restartToInstall')}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const changelogComponents = {
    a: ({ href, children }: { href?: string; children?: ReactNode }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400">
            {children}
        </a>
    ),
};

const cleanChangelog = (body: string) => {
    if (!body) return '';

    return body
        .replace(/\b[0-9a-f]{40}\b/gi, '')
        .replace(/(?:^|\s|-)([0-9a-f]{7,10})\b/gi, '')
        .replace(/\*\*Full Changelog\*\*:.*$/gim, '')
        .replace(/https?:\/\/github\.com\/[^\/]+\/[^\/]+\/compare\/[^\s)]+/gi, '')
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();
};
