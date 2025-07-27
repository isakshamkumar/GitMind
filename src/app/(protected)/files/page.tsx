import React, { Suspense } from 'react';

const FilesPageContent = () => {
    // Here you would put the actual content and logic for your files page
    // For now, it remains empty as per the original structure.
    return (
        <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Files content coming soon...</p>
        </div>
    );
};

const FilesPage = () => {
    return (
        <Suspense fallback={<div>Loading Files...</div>}>
            <FilesPageContent />
        </Suspense>
    );
};

export default FilesPage;