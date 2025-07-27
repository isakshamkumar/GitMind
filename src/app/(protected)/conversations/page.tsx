import React, { Suspense } from 'react'
import ConversationList from './conversation-list'

const ConversationsPageContent = () => {
    return (
        <ConversationList />
    )
}

const ConversationsPage = () => {
    return (
        <Suspense fallback={<div>Loading conversations...</div>}>
            <ConversationsPageContent />
        </Suspense>
    )
}

export default ConversationsPage 