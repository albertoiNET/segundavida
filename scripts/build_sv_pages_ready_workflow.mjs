/* Emits the n8n Workflow SDK source for the Pages-ready Telegram callback. */

const js = (source) => JSON.stringify(source);

const validateCallbackJs = String.raw`const incoming = $input.first() ?? {};
const input = incoming.json ?? {};
const body = input.body && typeof input.body === 'object' ? input.body : input;
const itemId = String(body.item_id ?? '').trim();
const validItemId = /^[A-Za-z0-9_-]{6,80}$/.test(itemId);
return [{ json: { ok: validItemId, item_id: itemId, response_code: validItemId ? 200 : 400, error: validItemId ? null : 'item_id_invalid' } }];`;

const normalizeRowJs = String.raw`const source = $input.first()?.json ?? {};
const fields = source.fields ?? source;
const requestedId = String($('Validate Pages callback').first()?.json?.item_id ?? '').trim();
const rowId = source.id ?? source.Id ?? fields.id ?? fields.Id ?? '';
const itemId = String(fields['item-id'] ?? '').trim();
const telegramMessageId = String(fields.telegram_message_id ?? '').trim();
const found = String(rowId).trim() !== '' && itemId === requestedId;
return [{ json: {
  ok: found,
  response_code: found ? 200 : 404,
  error: found ? null : 'item_not_found',
  row_id: rowId,
  item_id: requestedId,
  title: String(fields.title ?? '').trim(),
  category: String(fields.category ?? '').trim(),
  zone: String(fields.zone ?? '').trim(),
  telegram_message_id: telegramMessageId,
  already_sent: Boolean(telegramMessageId),
} }];`;

const validatePageJs = String.raw`const response = $input.first()?.json ?? {};
const row = $('Normalize publication row').first()?.json ?? {};
const itemId = String(row.item_id ?? '');
const body = [response.body, response.data, response.error?.message]
  .filter((value) => value !== null && value !== undefined && value !== '')
  .map((value) => typeof value === 'string' ? value : JSON.stringify(value))
  .join('\n');
const statusCode = Number(response.statusCode ?? response.status ?? response.error?.statusCode ?? 0);
const hasItemData = body.includes('id="static-item-data"')
  && (body.includes('"id":"' + itemId + '"') || body.includes('"id": "' + itemId + '"'));
const hasOgImage = body.includes('property="og:image"');
return [{ json: { ...row, static_page_ready: !response.error && (!statusCode || (statusCode >= 200 && statusCode < 300)) && hasItemData && hasOgImage } }];`;

const failPageJs = String.raw`const itemId = String($('Normalize publication row').first()?.json?.item_id ?? '');
throw new Error('GitHub Pages no ha servido la ficha pública a tiempo para ' + itemId + '.');`;

const successJs = String.raw`const row = $('Normalize publication row').first()?.json ?? {};
const telegram = $('Send publication to Telegram').first()?.json ?? {};
const messageId = telegram.result?.message_id ?? telegram.message_id ?? '';
return [{ json: { ok: true, item_id: row.item_id, telegram_message_id: String(messageId), message: 'Publicación enviada a Telegram' } }];`;

const noco = { authentication: 'nocoDbApiToken', workspaceId: { __rl: true, mode: 'list', value: 'wfrogvq8', cachedResultName: 'Default Workspace' }, projectId: { __rl: true, mode: 'list', value: 'p3amiucxfm0jzoc', cachedResultName: 'Aldea Pucela' }, table: { __rl: true, mode: 'list', value: 'mwk20n0679wz5fr', cachedResultName: 'Segunda Vida' } };
const responseParameters = (code) => "{ respondWith: 'json', responseBody: expr('={{ $json }}'), options: { responseCode: expr('={{ " + code + " }}') } }";

const code = `import { workflow, node, trigger, ifElse, newCredential, expr } from '@n8n/workflow-sdk';
const noco = ${js(noco)};
const nocoCredential = { nocoDbApiToken: newCredential('NocoDB Token account') };
const telegramCredential = { telegramApi: newCredential('Pucelo Bot') };
const webhook = trigger({ type: 'n8n-nodes-base.webhook', version: 2.1, config: { name: 'Pages ready webhook', position: [-2016, 0], credentials: { httpHeaderAuth: newCredential('Header Auth account') }, parameters: { httpMethod: 'POST', path: 'segundavida/pages-ready', authentication: 'headerAuth', responseMode: 'responseNode', options: {} } } });
const validateCallback = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Validate Pages callback', position: [-1792, 0], parameters: { mode: 'runOnceForAllItems', jsCode: ${js(validateCallbackJs)} } } });
const callbackValid = ifElse({ version: 2.2, config: { name: 'Callback valid?', position: [-1568, 0], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: expr('={{ $json.ok === true }}'), rightValue: true, operator: { type: 'boolean', operation: 'equals' } }], combinator: 'and' } } } });
const respondInvalid = node({ type: 'n8n-nodes-base.respondToWebhook', version: 1.5, config: { name: 'Respond invalid callback', position: [-1344, 224], parameters: ${responseParameters('$json.response_code ?? 400')} } });
const search = node({ type: 'n8n-nodes-base.nocoDb', version: 4, config: { name: 'Search publication row', position: [-1344, -32], credentials: nocoCredential, parameters: { resource: 'row', operation: 'search', ...noco, returnAll: false, limit: 1, downloadAttachments: false, where: expr("={{ '(item-id,eq,' + $('Validate Pages callback').first().json.item_id + ')' }}"), options: {} } } });
const normalizeRow = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Normalize publication row', position: [-1120, -32], parameters: { mode: 'runOnceForAllItems', jsCode: ${js(normalizeRowJs)} } } });
const itemFound = ifElse({ version: 2.2, config: { name: 'Publication found?', position: [-896, -32], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: expr('={{ $json.ok === true }}'), rightValue: true, operator: { type: 'boolean', operation: 'equals' } }], combinator: 'and' } } } });
const respondNotFound = node({ type: 'n8n-nodes-base.respondToWebhook', version: 1.5, config: { name: 'Respond publication not found', position: [-672, 224], parameters: ${responseParameters('$json.response_code ?? 404')} } });
const alreadySent = ifElse({ version: 2.2, config: { name: 'Telegram already sent?', position: [-672, -32], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: expr('={{ $json.already_sent === true }}'), rightValue: true, operator: { type: 'boolean', operation: 'equals' } }], combinator: 'and' } } } });
const respondAlready = node({ type: 'n8n-nodes-base.respondToWebhook', version: 1.5, config: { name: 'Respond already sent', position: [-448, 224], parameters: ${responseParameters('200')} } });
const verifyPage = node({ type: 'n8n-nodes-base.httpRequest', version: 4.5, config: { name: 'Verify public page', position: [-448, -32], parameters: { method: 'GET', url: expr("={{ 'https://segundavida.aldeapucela.org/i/' + encodeURIComponent(String($('Normalize publication row').first().json.item_id)) + '/?sv_callback=' + encodeURIComponent($execution.id) }}"), authentication: 'none', options: { redirect: { redirect: { followRedirects: true } }, response: { response: { fullResponse: true, neverError: true, responseFormat: 'text' } }, timeout: 15000 } } } });
const validatePage = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Validate public page', position: [-224, -32], parameters: { mode: 'runOnceForAllItems', jsCode: ${js(validatePageJs)} } } });
const pageReady = ifElse({ version: 2.2, config: { name: 'Public page ready?', position: [0, -32], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: expr('={{ $json.static_page_ready === true }}'), rightValue: true, operator: { type: 'boolean', operation: 'equals' } }], combinator: 'and' } } } });
const failPage = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Fail page verification', position: [224, 224], parameters: { mode: 'runOnceForAllItems', jsCode: ${js(failPageJs)} } } });
const sendTelegram = node({ type: 'n8n-nodes-base.telegram', version: 1.2, config: { name: 'Send publication to Telegram', position: [224, -32], credentials: telegramCredential, parameters: { resource: 'message', operation: 'sendMessage', chatId: '-1002403045183', text: expr("={{ '🆕 ' + String($('Normalize publication row').first().json.title ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\\"/g, '&quot;') + '\\n🏷 ' + String($('Normalize publication row').first().json.category ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\\"/g, '&quot;') + ' · ' + String($('Normalize publication row').first().json.zone ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\\\"/g, '&quot;') + '\\n\\nhttps://segundavida.aldeapucela.org/i/' + encodeURIComponent(String($('Normalize publication row').first().json.item_id ?? '')) + '/' }}"), replyMarkup: 'none', additionalFields: { appendAttribution: false, disable_notification: false, disable_web_page_preview: false, message_thread_id: 203637, parse_mode: 'HTML' } } } });
const updateMessageId = node({ type: 'n8n-nodes-base.nocoDb', version: 4, config: { name: 'Store Telegram message id', position: [448, -32], credentials: nocoCredential, parameters: { resource: 'row', operation: 'update', ...noco, id: expr("={{ $('Normalize publication row').first().json.row_id }}"), fieldsMapper: { mappingMode: 'defineBelow', value: { telegram_message_id: expr("={{ $('Send publication to Telegram').first().json.result?.message_id ?? $('Send publication to Telegram').first().json.message_id ?? '' }}") }, matchingColumns: [], schema: [{ id: 'telegram_message_id', displayName: 'telegram_message_id', type: 'string', display: true, readOnly: false }], attemptToConvertTypes: false, convertFieldsToString: false } } } });
const success = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: 'Build callback success', position: [672, -32], parameters: { mode: 'runOnceForAllItems', jsCode: ${js(successJs)} } } });
const respondSuccess = node({ type: 'n8n-nodes-base.respondToWebhook', version: 1.5, config: { name: 'Respond callback success', position: [896, -32], parameters: { respondWith: 'json', responseBody: expr('={{ $json }}'), options: { responseCode: 200 } } } });
export default workflow('sv-pages-ready', 'Telegram tras publicar ficha estática')
  .add(webhook).to(validateCallback).to(callbackValid.onTrue(search.to(normalizeRow)).onFalse(respondInvalid))
  .add(normalizeRow).to(itemFound.onTrue(alreadySent.onTrue(respondAlready).onFalse(verifyPage.to(validatePage.to(pageReady.onTrue(sendTelegram.to(updateMessageId.to(success.to(respondSuccess)))).onFalse(failPage))))).onFalse(respondNotFound));`;

process.stdout.write(code);
