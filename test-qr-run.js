// Prueba del sistema de extracción de RUN del QR
// Este script puede ser usado para probar las funciones de extracción

// Función para extraer RUN de URL del Registro Civil
const extractRunFromUrl = (url) => {
    try {
        // Buscar patrón RUN= en la URL
        const runMatch = url.match(/RUN=([^&]+)/);
        if (runMatch && runMatch[1]) {
            return runMatch[1].trim();
        }
        return null;
    } catch (error) {
        console.error('Error al extraer RUN de URL:', error);
        return null;
    }
};

// Función para validar si el texto escaneado es un RUN válido
const isValidRun = (text) => {
    // Formato RUN chileno: 12345678-9
    const runPattern = /^\d{7,8}-[\dkK]$/;
    return runPattern.test(text);
};

// URLs de prueba
const testUrls = [
    'https://portal.sidiv.registrocivil.cl/docstatus?RUN=21302778-6&type=CEDULA&serial=530498060&mrz=530498060503051853305186',
    'https://portal.sidiv.registrocivil.cl/docstatus?RUN=21320154-9&type=CEDULA&serial=532064733&mrz=532064733903061593306150'
];

// RUNs directos de prueba
const testRuns = [
    '21302778-6',
    '21320154-9',
    '12345678-9',
    '87654321-K'
];

console.log('=== PRUEBA DEL SISTEMA DE EXTRACCIÓN DE RUN ===\n');

console.log('1. Prueba con URLs del Registro Civil:');
testUrls.forEach((url, index) => {
    const run = extractRunFromUrl(url);
    console.log(`   URL ${index + 1}: ${run ? `✓ RUN extraído: ${run}` : '✗ No se pudo extraer RUN'}`);
});

console.log('\n2. Prueba con RUNs directos:');
testRuns.forEach((run, index) => {
    const isValid = isValidRun(run);
    console.log(`   RUN ${index + 1} (${run}): ${isValid ? '✓ Válido' : '✗ No válido'}`);
});

console.log('\n3. Prueba de casos especiales:');
const specialCases = [
    'texto-cualquiera',
    '123456789',  // Sin dígito verificador
    '1234567-8',  // Muy corto
    'Juan Pérez',  // Nombre
    ''  // Vacío
];

specialCases.forEach((test, index) => {
    const isValid = isValidRun(test);
    console.log(`   Caso ${index + 1} ("${test}"): ${isValid ? '✓ Válido' : '✗ No válido'}`);
});

console.log('\n=== FIN DE LA PRUEBA ===');
