import React, { Suspense } from 'react'
import QuestionList from './question-list'

const QAPageContent = () => {
    return (
        <QuestionList />
    )
}

const QAPage = () => {
    return (
        <Suspense fallback={<div>Loading questions...</div>}>
            <QAPageContent />
        </Suspense>
    )
}

export default QAPage