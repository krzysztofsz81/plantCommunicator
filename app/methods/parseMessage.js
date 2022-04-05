import upcast from 'upcast';

const computeFormat = (format) => {
    if (format.includes('RANGE')) {
        const [min, max] = format.split('(')[1].split(')')[0].split('-'); // RANGE(0-4095)
        return {
            kind: 'range',
            format: 'number',
            min: parseInt(min, 10),
            max: parseInt(max, 10),
        };
    }
    switch (format) {
        case 'BUTTON':
            return {
                kind: 'button',
                format: 'boolean',
            };
        case 'CELSIUS':
            return {
                kind: 'temperature',
                valueSuffix: '°C',
                format: 'number',
            };
        case 'PERCENT':
            return {
                kind: 'percent',
                valueSuffix: '%',
                format: 'number',
            };
        default:
            return {
                format: 'string',
            };
    }
};

const computeValue = (info, value) => upcast.to(value, info.format);

export default function parseMessage(message) {
    // Example:
    // REGISTER_INPUT/water_pump:SWITCH/false
    // REGISTER_OUTPUT/soil_moisture:RANGE(0-4095)/3521
    const [action = null, peripheralDetails = '', peripheralValue = null] = message.split('/');
    const [name = null, format = null] = peripheralDetails.split(':');

    const info = computeFormat(format);
    const value = computeValue(info, peripheralValue);
    return {
        action,
        peripheral: {
            name,
            info,
            value,
        },
    };
}
