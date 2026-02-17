const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname, '..', '..');
const MESSAGES_PATH = path.join(ROOT, 'data', 'messages.json');
const PROFILE_CONTROLLER_PATH = path.join(ROOT, 'js', 'ui', 'profile_chat_controller.js');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function parseProfileImageMap(filePath) {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(/export const PROFILE_IMAGES\s*=\s*({[\s\S]*?});/);
  if (!match) {
    throw new Error('Could not find PROFILE_IMAGES export in profile_chat_controller.js');
  }
  const context = { PROFILE_IMAGES: null };
  vm.createContext(context);
  vm.runInContext(`PROFILE_IMAGES = ${match[1]};`, context);
  return context.PROFILE_IMAGES;
}

function validateMessages(messages, profileMap) {
  const requiredFields = ['id', 'type', 'icon', 'speaker', 'emotion', 'category', 'priority', 'template'];
  const validPriorities = new Set(['low', 'normal', 'high']);
  const validReplaceScopes = new Set(['day', 'global']);
  const errors = [];
  const ids = new Set();

  messages.forEach((entry, index) => {
    const tag = `messages[${index}]`;
    if (!entry || typeof entry !== 'object') {
      errors.push(`${tag}: entry must be an object`);
      return;
    }
    requiredFields.forEach((field) => {
      if (!(field in entry)) {
        errors.push(`${tag}: missing required field "${field}"`);
      }
    });

    const id = String(entry.id || '').trim();
    if (!id) {
      errors.push(`${tag}: id must be a non-empty string`);
    } else if (ids.has(id)) {
      errors.push(`${tag}: duplicate id "${id}"`);
    } else {
      ids.add(id);
    }

    const speaker = String(entry.speaker || '').trim();
    const emotion = String(entry.emotion || '').trim();
    if (!profileMap[speaker]) {
      errors.push(`${tag}: unknown speaker "${speaker}"`);
    } else if (!profileMap[speaker][emotion]) {
      errors.push(`${tag}: emotion "${emotion}" not mapped for speaker "${speaker}" in PROFILE_IMAGES`);
    }

    const priority = String(entry.priority || '').trim();
    if (!validPriorities.has(priority)) {
      errors.push(`${tag}: invalid priority "${priority}"`);
    }

    if ('replaceScope' in entry) {
      const replaceScope = String(entry.replaceScope || '').trim();
      if (!validReplaceScopes.has(replaceScope)) {
        errors.push(`${tag}: invalid replaceScope "${replaceScope}"`);
      }
    }

    if ('cooldownMs' in entry) {
      const cooldownMs = Number(entry.cooldownMs);
      if (!Number.isFinite(cooldownMs) || cooldownMs < 0) {
        errors.push(`${tag}: cooldownMs must be a non-negative number`);
      }
    }

    if ('maxPerDay' in entry) {
      const maxPerDay = Number(entry.maxPerDay);
      if (!Number.isFinite(maxPerDay) || maxPerDay < 0) {
        errors.push(`${tag}: maxPerDay must be a non-negative number`);
      }
    }
  });

  return errors;
}

function main() {
  const raw = readJson(MESSAGES_PATH);
  if (!raw || !Array.isArray(raw.messages)) {
    throw new Error('data/messages.json must contain a top-level "messages" array');
  }
  const profileMap = parseProfileImageMap(PROFILE_CONTROLLER_PATH);
  const errors = validateMessages(raw.messages, profileMap);
  if (errors.length > 0) {
    console.error('Message validation failed:');
    errors.forEach((line) => console.error(`- ${line}`));
    process.exit(1);
  }
  console.log(`Message validation passed (${raw.messages.length} entries).`);
}

main();
