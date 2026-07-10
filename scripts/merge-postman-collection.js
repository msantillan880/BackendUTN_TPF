#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

function readJson(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
}

function writeJson(filePath, data) {
    const json = `${JSON.stringify(data, null, 2)}\n`;
    fs.writeFileSync(filePath, json, 'utf8');
}

function toMapByName(items = []) {
    const map = new Map();
    for (const item of items) {
        if (item && typeof item.name === 'string') {
            map.set(item.name, item);
        }
    }
    return map;
}

function mergeVariables(incomingVars = [], currentVars = [], keepCurrentValues = true) {
    if (!keepCurrentValues) return incomingVars;

    const currentByKey = new Map(
        (currentVars || [])
            .filter((v) => v && typeof v.key === 'string')
            .map((v) => [v.key, v])
    );

    return (incomingVars || []).map((incomingVar) => {
        if (!incomingVar || typeof incomingVar.key !== 'string') return incomingVar;
        const currentVar = currentByKey.get(incomingVar.key);
        if (!currentVar || !Object.prototype.hasOwnProperty.call(currentVar, 'value')) {
            return incomingVar;
        }

        return {
            ...incomingVar,
            value: currentVar.value,
        };
    });
}

function mergeTopLevelItems(currentItems = [], incomingItems = [], preserveNames = new Set()) {
    const currentByName = toMapByName(currentItems);
    const incomingNames = new Set((incomingItems || []).map((item) => item?.name));

    const merged = [];

    for (const incomingItem of incomingItems || []) {
        const name = incomingItem?.name;
        if (typeof name === 'string' && preserveNames.has(name) && currentByName.has(name)) {
            merged.push(currentByName.get(name));
            continue;
        }
        merged.push(incomingItem);
    }

    for (const currentItem of currentItems || []) {
        const name = currentItem?.name;
        if (typeof name !== 'string') continue;
        if (!preserveNames.has(name)) continue;
        if (incomingNames.has(name)) continue;
        merged.push(currentItem);
    }

    return merged;
}

function parseArgs(argv) {
    const args = {
        current: '',
        incoming: '',
        output: '',
        preserve: 'Testing',
        keepVariableValues: true,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        switch (token) {
            case '--current':
                args.current = argv[i + 1] || '';
                i += 1;
                break;
            case '--incoming':
                args.incoming = argv[i + 1] || '';
                i += 1;
                break;
            case '--output':
                args.output = argv[i + 1] || '';
                i += 1;
                break;
            case '--preserve':
                args.preserve = argv[i + 1] || '';
                i += 1;
                break;
            case '--no-keep-variable-values':
                args.keepVariableValues = false;
                break;
            default:
                break;
        }
    }

    return args;
}

function usage() {
    console.log(
        [
            'Uso:',
            'node scripts/merge-postman-collection.js --current <archivo-actual.json> --incoming <archivo-nuevo.json> --output <archivo-salida.json> [--preserve "Testing,OtroFolder"] [--no-keep-variable-values]',
            '',
            'Notas:',
            '- Preserva por nombre carpetas/items de primer nivel (default: Testing).',
            '- Mantiene valores de variables actuales por default (ejemplo: accessToken, ownerEmail).',
        ].join('\n')
    );
}

function main() {
    const args = parseArgs(process.argv.slice(2));
    if (!args.current || !args.incoming || !args.output) {
        usage();
        process.exit(1);
    }

    const currentPath = path.resolve(process.cwd(), args.current);
    const incomingPath = path.resolve(process.cwd(), args.incoming);
    const outputPath = path.resolve(process.cwd(), args.output);

    const current = readJson(currentPath);
    const incoming = readJson(incomingPath);

    const preserveNames = new Set(
        String(args.preserve || '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean)
    );

    const merged = {
        ...incoming,
        item: mergeTopLevelItems(current.item || [], incoming.item || [], preserveNames),
        variable: mergeVariables(incoming.variable || [], current.variable || [], args.keepVariableValues),
    };

    writeJson(outputPath, merged);

    console.log('Merge completado.');
    console.log(`Actual: ${currentPath}`);
    console.log(`Nuevo:  ${incomingPath}`);
    console.log(`Salida: ${outputPath}`);
    console.log(`Preservado: ${[...preserveNames].join(', ') || '(ninguno)'}`);
    console.log(`Conservar valores de variables: ${args.keepVariableValues ? 'si' : 'no'}`);
}

main();