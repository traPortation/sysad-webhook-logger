const crypto = require('crypto')
const fetch = require('node-fetch')
const { STATUS_CODES } = require('http')

class HTTPError extends Error {
  constructor(code, message = STATUS_CODES[code]) {
    super(message)
    this.name = code.toString()
    this.statusCode = code
  }
}

const WEBHOOK_ID = '98531cec-600c-44b2-b87a-267c007b59c7'
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
const GITHUB_SECRET = process.env.GITHUB_SECRET || ''

const channelIDs = {
  '#p/2/t/logs': '962b94cb-2971-4246-aba0-cd4d05a718a8'
}

const verifyBody = (signature, body) => {
  const payload = JSON.stringify(body)
  const sign = `sha1=${crypto
    .createHmac('sha1', GITHUB_SECRET)
    .update(payload)
    .digest('hex')}`

  return (
    sign.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(sign))
  )
}

const sendMessage = (channelID, text) => {
  const hmac = crypto.createHmac('sha1', WEBHOOK_SECRET)
  hmac.update(text)

  return fetch(`https://q.trap.jp/api/v3/webhooks/${WEBHOOK_ID}`, {
    method: 'POST',
    body: text,
    headers: {
      'X-TRAQ-Signature': hmac.digest('hex'),
      'X-TRAQ-Channel-Id': channelID,
      'Content-Type': 'text/plain'
    }
  })
}

const format = text =>
  text
    .replace(/<details>.+?<\/details>/gs, '')
    .replace(
      /\[\/\/\]: # \(dependabot-start\).+\[\/\/\]: # \(dependabot-end\)/s,
      ''
    )
    .replace(
      /\[\/\/\]: # \(dependabot-automerge-start\).+\[\/\/\]: # \(dependabot-automerge-end\)/s,
      ''
    )

exports.webhook = async (req, res) => {
  const headers = req.headers
  const body = req.body
  const event = headers['x-github-event']

  if (!verifyBody(headers['x-hub-signature'] || '', body)) {
    throw new HTTPError(403, 'X-Hub-Signature mis-match')
  }

  if (
    body.action === 'closed' &&
    body.pull_request &&
    body.pull_request.merged
  ) {
    const pr = body.pull_request
    const user = pr.user
    const content = format(pr.body)

    const text =
      `## [${pr.title}](${pr.html_url})がマージされました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
PR作成者: [${user.login}](${user.html_url})
マージした人: [${body.sender.login}](${body.sender.html_url})

---
` + content

    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'issues' && body.action === 'opened') {
    const issue = body.issue
    const user = issue.user
    const content = format(issue.body)

    const text =
      `## 新しいissue[${issue.title}](${
        issue.html_url || issue.url
      })が作成されました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
issue作成者: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'issues' && body.aciton === 'edited') {
    const issue = body.issue
    const user = issue.user
    const content = format(issue.body)

    const text =
      `## issue[${issue.title}](${issue.html_url || issue.url})が編集されました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
issue編集者: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'issues' && body.action === 'closed') {
    const issue = body.issue
    const user = body.sender
    const content = format(issue.body)

    const text =
      `## issue[${issue.title}](${issue.html_url || issue.url})が閉じられました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
issueを閉じた人: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'issues' && body.action === 'reopened') {
    const issue = body.issue
    const user = body.sender
    const content = format(issue.body)

    const text =
      `## issue[${issue.title}](${
        issue.html_url || issue.url
      })が再び開かれました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
issueを開けた人: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'issue_comment' && body.action === 'created') {
    const issue = body.issue
    const comment = body.comment
    const user = comment.user
    const content = format(comment.body)

    const text =
      `## issue[${issue.title}](${
        issue.html_url || issue.url
      })にコメントが追加されました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
コメントした人: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'issue_comment' && body.action === 'edited') {
    const issue = body.issue
    const comment = body.comment
    const user = comment.user
    const content = format(comment.body)

    const text =
      `## issue[${issue.title}](${
        issue.html_url || issue.url
      })のコメントが変更されました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
コメントした人: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'pull_request' && body.action === 'opened') {
    const pr = body.pull_request
    const user = pr.user
    const content = format(pr.body)

    const text =
      `## 新しいPR[${pr.title}](${pr.html_url})が作成されました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
PR作成者: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'pull_request' && body.action === 'edited') {
    const pr = body.pull_request
    const user = pr.user
    const content = format(pr.body)

    const text =
      `## PR[${pr.title}](${pr.html_url})が編集されました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
PR編集者: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'pull_request' && body.action === 'review_requested') {
    const pr = body.pull_request
    const user = pr.user
    const content = format(pr.body)
    const reviewers = pr.requested_reviewers

    const text =
      `## PR[${pr.title}](${pr.html_url})でレビューがリクエストされました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
リクエストした人: [${user.login}](${user.html_url})
リクエストされた人: ${reviewers
        .map(reviewer => `[${reviewer.login}](${reviewer.html_url})`)
        .join(', ')}

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (event === 'pull_request_review' && body.action === 'submitted') {
    const pr = body.pull_request
    const review = body.review
    const user = review.user
    const content = review.body ? format(review.body) : ''

    const text =
      `## PR[${pr.title}](${pr.html_url})がレビューされました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
レビューした人: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else if (
    event === 'pull_request_review_comment' &&
    body.action === 'created'
  ) {
    const pr = body.pull_request
    const comment = body.comment
    const user = comment.user
    const content = format(comment.body)

    const text =
      `## PR[${pr.title}](${pr.html_url})にレビューコメントが追加されました
リポジトリ: [${body.repository.name}](${body.repository.html_url})
コメントした人: [${user.login}](${user.html_url})

---
` + content
    await sendMessage(channelIDs['#p/2/t/logs'], text)
    res.send('OK')
  } else {
    res.send('Other Action')
  }
}
