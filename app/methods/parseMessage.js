import upcast from 'upcast';

const SENSOR_DATA_TYPE = {
    Boolean: 'Boolean',
    String: 'String',
    Float: 'Float',
    Int: 'Int',
};

const SENSOR_DATA_FORMAT = {
    Percent: 'Percent',
    Celsius: 'Celsius',
    Default: 'Default',
};

const SENSOR_DATA_TYPE_MAP = {
    [SENSOR_DATA_TYPE.Boolean]: (val) => upcast.to(val, 'boolean'),
    [SENSOR_DATA_TYPE.String]: (val) => upcast.to(val, 'string'),
    [SENSOR_DATA_TYPE.Float]: (val) => upcast.to(val, 'number'),
    [SENSOR_DATA_TYPE.Int]: (val) => upcast.to(val, 'number'),
};

const SENSOR_DATA_FORMAT_MAP = {
    [SENSOR_DATA_FORMAT.Percent]: '%',
    [SENSOR_DATA_FORMAT.Celsius]: '°C',
    [SENSOR_DATA_FORMAT.Default]: null,
};

const formatValue = (value, type = SENSOR_DATA_TYPE.String) => {
    if (!value) return null;
    return SENSOR_DATA_TYPE_MAP[type](value);
};

export default function parseMessage(message) {
    // Example: REGISTER_OUTPUT/led_green:Boolean/false
    const [action = null, peripheralInfo = '', peripheralDataValue = null] = message.split('/');
    const [
        peripheralName = null,
        peripheralDataType = null,
        peripheralDataFormat = SENSOR_DATA_FORMAT.Default,
        peripheralCalibration = false,
    ] = peripheralInfo.split(':');
    return {
        action,
        peripheralName,
        peripheralDataType,
        peripheralCalibration,
        peripheralDataFormat: SENSOR_DATA_FORMAT_MAP[peripheralDataFormat],
        peripheralDataValue: formatValue(peripheralDataValue, peripheralDataType),
    };
}
