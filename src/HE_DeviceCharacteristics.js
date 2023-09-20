var Characteristic, CommunityTypes, accClass;

module.exports = class DeviceCharacteristics {
    constructor(accessories, svcs, char) {
        this.platform = accessories.mainPlatform;
        // this.appEvts = accessories.mainPlatform.appEvts;
        Characteristic = char;
        // Service = svcs;
        CommunityTypes = accessories.CommunityTypes;
        accClass = accessories;
        this.log = accessories.log;
        this.logInfo = accessories.logInfo;
        this.logAlert = accessories.logAlert;
        this.logGreen = accessories.logGreen;
        this.logNotice = accessories.logNotice;
        this.logDebug = accessories.logDebug;
        this.logError = accessories.logError;
        this.logWarn = accessories.logWarn;
        this.logConfig = accessories.logConfig;
        this.configItems = accessories.configItems;
        this.accessories = accessories;
        this.client = accessories.client;
        this.myUtils = accessories.myUtils;
        this.transforms = accessories.transforms;
    }

    manageGetCharacteristic(svc, acc, char, attr, opts = {}) {
        let c = this.getOrAddService(svc).getCharacteristic(char);
        if (!c._events.get) {
            c.on("get", (callback) => {
                if (attr === "status" && char === Characteristic.StatusActive) {
                    callback(null, accClass.transforms.transformStatus(this.context.deviceData.status));
                } else {
                    const val = accClass.transforms.transformAttributeState(opts.get_altAttr || attr, this.context.deviceData.attributes[opts.get_altValAttr || attr], c.displayName, opts);
                    if (val === undefined || val === null) {
                        accClass.logError(`Error getting value for Characteristic [${c.displayName}] Using Attribute (${attr}) for ${acc.displayName} (${acc.context.deviceData.name})`);
                    }
                    accClass.log_get(attr, char, acc, accClass.transforms.transformAttributeState(opts.get_altAttr || attr, this.context.deviceData.attributes[opts.get_altValAttr || attr], c.displayName, opts));
                    callback(null, val);
                }
            });
            if (opts.props && Object.keys(opts.props).length) c.setProps(opts.props);
            if (opts.evtOnly && opts.evtOnly === true) c.eventOnlyCharacteristic = opts.evtOnly;
            c.getValue();
            accClass.storeCharacteristicItem(attr, this.context.deviceData.deviceid, c);
        } else {
            if (attr === "status" && char === Characteristic.StatusActive) {
                c.updateValue(accClass.transforms.transformStatus(this.context.deviceData.status));
            } else {
                const val = accClass.transforms.transformAttributeState(opts.get_altAttr || attr, this.context.deviceData.attributes[opts.get_altValAttr || attr], c.displayName, opts);
                if (val === undefined || val === null) {
                    accClass.logError(`Error getting value for Characteristic [${c.displayName}] Using Attribute (${attr}) for ${acc.displayName} (${acc.context.deviceData.name})`);
                }
                accClass.log_get(attr, char, acc, accClass.transforms.transformAttributeState(opts.get_altAttr || attr, this.context.deviceData.attributes[opts.get_altValAttr || attr], c.displayName, opts));
                c.updateValue(val);
            }
        }
        if (!c._events.change) {
            c.on("change", (chg) => {
                accClass.log_change(attr, char, acc, chg);
            });
        }
    }

    manageGetSetCharacteristic(svc, acc, char, attr, opts = {}) {
        let c = this.getOrAddService(svc).getCharacteristic(char);
        if (!c._events.get || !c._events.set) {
            if (!c._events.get) {
                c.on("get", (callback) => {
                    const val = accClass.transforms.transformAttributeState(opts.get_altAttr || attr, this.context.deviceData.attributes[opts.get_altValAttr || attr], c.displayName, opts);
                    if (val === undefined || val === null) {
                        accClass.logError(`Error getting value for Characteristic [${c.displayName}] Using Attribute (${attr}) for ${acc.displayName} (${acc.context.deviceData.name})`);
                    }
                    accClass.log_get(attr, char, acc, val);
                    callback(null, val);
                });
            }
            if (!c._events.set) {
                c.on("set", (value, callback) => {
                    const cmdName = accClass.transforms.transformCommandName(opts.set_altAttr || attr, value);
                    const cmdVal = accClass.transforms.transformCommandValue(opts.set_altAttr || attr, value);
                    if (opts.cmdHasVal === true || opts.cmdHasIntVal === true) {
                        acc.sendCommand(callback, acc, this.context.deviceData, cmdName, {
                            value1: opts.cmdHasIntVal === true ? parseInt(cmdVal) : cmdVal,
                        });
                    } else {
                        acc.sendCommand(callback, acc, this.context.deviceData, cmdVal);
                    }
                    if (opts.updAttrVal) this.context.deviceData.attributes[attr] = accClass.transforms.transformAttributeState(opts.set_altAttr || attr, this.context.deviceData.attributes[opts.set_altValAttr || attr], c.displayName, opts, opts);
                });
                if (opts.props && Object.keys(opts.props).length) c.setProps(opts.props);
                if (opts.evtOnly && opts.evtOnly === true) c.eventOnlyCharacteristic = opts.evtOnly;
                c.getValue();
            }
            c.getValue();
            accClass.log_set(attr, char, acc, accClass.transforms.transformAttributeState(opts.get_altAttr || attr, this.context.deviceData.attributes[opts.get_altValAttr || attr], c.displayName, opts));
            accClass.storeCharacteristicItem(attr, this.context.deviceData.deviceid, c);
        } else {
            const val = accClass.transforms.transformAttributeState(opts.get_altAttr || attr, this.context.deviceData.attributes[opts.get_altValAttr || attr], c.displayName, opts);
            if (val === undefined || val === null) {
                accClass.logError(`Error getting value for Characteristic [${c.displayName}] Using Attribute (${attr}) for ${acc.displayName} (${acc.context.deviceData.name})`);
            }
            accClass.log_get(attr, char, acc, accClass.transforms.transformAttributeState(opts.get_altAttr || attr, this.context.deviceData.attributes[opts.get_altValAttr || attr], c.displayName, opts));
            c.updateValue(val);
        }
        if (!c._events.change) {
            c.on("change", (chg) => {
                accClass.log_change(attr, char, acc, chg);
            });
        }
    }

    acceleration_sensor(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.MotionDetected, "acceleration");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("acceleration_sensor");
        return _accessory;
    }

    air_purifier(_accessory, _service) {
        let actState = _accessory.context.deviceData.attributes.switch === "on" ? Characteristic.Active.ACTIVE : Characteristic.Active.INACTIVE;
        let c = this.getOrAddService(_service).getCharacteristic(Characteristic.Active);
        if (!c._events.get || !c._events.set) {
            if (!c._events.get) {
                c.on("get", (callback) => {
                    callback(null, actState);
                });
            }
            if (!c._events.set) {
                c.on("set", (value, callback) => {
                    _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, value ? "on" : "off");
                });
            }
            c.getValue();
            accClass.storeCharacteristicItem("switch", _accessory.context.deviceData.deviceid, c);
        } else {
            c.updateValue(actState);
        }

        c = this.getaddService(_service).getCharacteristic(Characteristic.CurrentAirPurifierState);
        let apState = actState === Characteristic.Active.INACTIVE ? Characteristic.CurrentAirPurifierState.INACTIVE : Characteristic.CurrentAirPurifierState.PURIFYING_AIR;
        if (!c._events.get) {
            c.on("get", (callback) => {
                callback(null, apState);
            });
        }
        c.updateValue(apState);

        c = this.getaddService(CommunityTypes.NewAirPurifierService).getCharacteristic(CommunityTypes.FanOscilationMode);
        if (!c._events.get || !c._events.set) {
            if (!c._events.get) {
                c.on("get", (callback) => {
                    callback(null, this.transforms.transformAttributeState("fanMode", _accessory.context.deviceData.attributes.fanMode));
                });
            }
            if (!c._events.set) {
                c.on("set", (value, callback) => {
                    _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, "setFanMode", {
                        value1: this.transforms.transformCommandValue("fanMode", value),
                    });
                });
            }
        }
        this.accessories.storeCharacteristicItem("fanMode", _accessory.context.deviceData.deviceid, c);
        _accessory.context.deviceGroups.push("air_purifier");
        return _accessory;
    }

    air_quality(_accessory, _service) {
        _accessory.getOrAddService(_service).setCharacteristic(Characteristic.StatusFault, Characteristic.StatusFault.NO_FAULT);
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.AirQuality, "airQualityIndex");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusLowBattery, "battery");
        if (_accessory.hasAttribute("pm25")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.PM2_5Density, "pm25");
        }
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("air_quality");
        return _accessory;
    }

    alarm_system(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.SecuritySystemCurrentState, "alarmSystemStatus");
        _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.SecuritySystemTargetState, "alarmSystemStatus");
        _accessory.context.deviceGroups.push("alarm_system");
        return _accessory;
    }

    battery(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.BatteryLevel, "battery");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusLowBattery, "battery");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.ChargingState, "powerSource");
        _accessory.context.deviceGroups.push("battery");
        return _accessory;
    }

    button(_accessory, _service) {
        let that = this;
        let validValues = this.transforms.getSupportedButtonVals(_accessory) || [0, 2];
        // console.log("validValues:", validValues);
        const btnCnt = _accessory.context.deviceData.attributes.numberOfButtons || 1;
        // console.log("btnCnt: ", btnCnt);
        if (btnCnt >= 1) {
            for (let bNum = 1; bNum <= btnCnt; bNum++) {
                const svc = _accessory.getOrAddServiceByName(_service, `${_accessory.context.deviceData.deviceid}_${bNum}`, bNum);
                let c = svc.getCharacteristic(Characteristic.ProgrammableSwitchEvent);
                c.setProps({
                    validValues: validValues,
                });
                c.eventOnlyCharacteristic = false;
                if (!c._events.get) {
                    that.accessories._buttonMap[`${_accessory.context.deviceData.deviceid}_${bNum}`] = svc;
                    c.on("get", (callback) => {
                        this.value = -1;
                        callback(null, that.transforms.transformAttributeState("button", _accessory.context.deviceData.attributes.button));
                    });
                    _accessory.buttonEvent = this.buttonEvent.bind(_accessory);
                    this.accessories.storeCharacteristicItem("button", _accessory.context.deviceData.deviceid, c);
                }
                svc.getCharacteristic(Characteristic.ServiceLabelIndex).setValue(bNum);
            }
            _accessory.context.deviceGroups.push("button");
        }
        return _accessory;
    }

    buttonEvent(btnNum, btnVal, devId, btnMap) {
        console.log("Button Press Event... | Button Number: (" + btnNum + ") | Button Value: " + btnVal);
        let bSvc = btnMap[`${devId}_${btnNum}`];
        // console.log(bSvc);
        if (bSvc) {
            let btnOut = undefined;
            switch (btnVal) {
                case "pushed":
                    btnOut = Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS;
                    break;
                case "held":
                    btnOut = Characteristic.ProgrammableSwitchEvent.LONG_PRESS;
                    break;
                case "doubleTapped":
                    btnOut = Characteristic.ProgrammableSwitchEvent.DOUBLE_PRESS;
                    break;
            }
            // console.log("btnOut: ", btnOut);
            bSvc.getCharacteristic(Characteristic.ProgrammableSwitchEvent).setValue(btnOut);
        }
    }

    carbon_dioxide(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CarbonDioxideDetected, "carbonDioxideMeasurement");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CarbonDioxideLevel, "carbonDioxideMeasurement");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("carbon_dioxide");
        return _accessory;
    }

    carbon_monoxide(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CarbonMonoxideDetected, "carbonMonoxide");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("carbon_monoxide");
        return _accessory;
    }

    contact_sensor(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.ContactSensorState, "contact");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("contact_sensor");
        return _accessory;
    }

    energy_meter(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, CommunityTypes.KilowattHours, "energy");
        _accessory.context.deviceGroups.push("energy_meter");
        return _accessory;
    }

    fan(_accessory, _service) {
        if (_accessory.hasAttribute("switch")) {
            _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.Active, "switch");
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CurrentFanState, "switch", {
                get_altAttr: "fanState",
            });
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.CurrentFanState);
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.Active);
        }
        let spdSteps = 1;
        if (_accessory.hasDeviceFlag("fan_3_spd")) spdSteps = 33;
        if (_accessory.hasDeviceFlag("fan_4_spd")) spdSteps = 25;
        if (_accessory.hasDeviceFlag("fan_5_spd")) spdSteps = 20;
        let spdAttr = _accessory.hasAttribute("speed") && _accessory.hasCommand("setSpeed") ? "speed" : _accessory.hasAttribute("level") ? "level" : undefined;
        // console.log("fanSpeed Attribute: ", spdAttr);
        if (_accessory.hasAttribute("level") || _accessory.hasAttribute("speed")) {
            _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.RotationSpeed, spdAttr, {
                cmdHasVal: true,
                spdSteps: spdSteps,
                props: {
                    minStep: spdSteps,
                },
            });
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.RotationSpeed);
        }
        _accessory.context.deviceGroups.push("fan");
        return _accessory;
    }

    garage_door(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CurrentDoorState, "door");
        _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.TargetDoorState, "door");
        _accessory.getOrAddService(_service).getCharacteristic(Characteristic.ObstructionDetected).updateValue(false);
        return _accessory;
    }

    humidity_sensor(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CurrentRelativeHumidity, "humidity");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("humidity_sensor");
        return _accessory;
    }

    illuminance_sensor(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CurrentAmbientLightLevel, "illuminance", {
            props: {
                minValue: 0,
                maxValue: 100000,
            },
        });
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("illuminance_sensor");
        return _accessory;
    }

    light(_accessory, _service) {
        _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.On, "switch");
        if (_accessory.hasAttribute("level")) {
            _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.Brightness, "level", {
                cmdHasVal: true,
            });
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.Brightness);
        }
        if (_accessory.hasAttribute("hue") && _accessory.hasCommand("setHue")) {
            _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.Hue, "hue", {
                cmdHasVal: true,
                props: {
                    minValue: 1,
                    maxValue: 30000,
                },
            });
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.Hue);
        }
        if (_accessory.hasAttribute("saturation") && _accessory.hasCommand("setSaturation")) {
            _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.Saturation, "saturation", {
                cmdHasVal: true,
            });
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.Saturation);
        }
        if (_accessory.hasAttribute("colorTemperature") && _accessory.hasCommand("setColorTemperature")) {
            _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.ColorTemperature, "colorTemperature", {
                cmdHasIntVal: true,
                props: {
                    maxValue: 500,
                    minValue: 140,
                },
            });
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.ColorTemperature);
        }
        let canUseAL = this.configItems.adaptive_lighting !== false && _accessory.isAdaptiveLightingSupported && !_accessory.hasDeviceFlag("light_no_al") && _accessory.hasAttribute("level") && _accessory.hasAttribute("colorTemperature");
        if (canUseAL && !_accessory.adaptiveLightingController) {
            _accessory.addAdaptiveLightingController(_accessory.getOrAddService(_service));
        } else if (!canUseAL && _accessory.adaptiveLightingController) {
            _accessory.removeAdaptiveLightingController();
        }
        _accessory.context.deviceGroups.push("light_bulb");
        return _accessory;
    }

    lock(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.LockCurrentState, "lock");
        _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.LockTargetState, "lock");
        _accessory.context.deviceGroups.push("lock");
        return _accessory;
    }

    motion_sensor(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.MotionDetected, "motion");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("motion_sensor");
        return _accessory;
    }

    power_meter(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, CommunityTypes.Watts, "power");
        _accessory.context.deviceGroups.push("power_meter");
        return _accessory;
    }

    presence_sensor(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.OccupancyDetected, "presence");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("presence_sensor");
        return _accessory;
    }

    outlet(_accessory, _service) {
        _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.On, "switch");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.OutletInUse, "switch", {
            get_altAttr: "outlet",
        });
        _accessory.context.deviceGroups.push("outlet");
        return _accessory;
    }

    smoke_detector(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.SmokeDetected, "smoke");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("smoke_detector");
        return _accessory;
    }

    speaker(_accessory, _service) {
        let isSonos = _accessory.context.deviceData.manufacturerName === "Sonos";
        let lvlAttr = isSonos || _accessory.hasAttribute("volume") ? "volume" : _accessory.hasAttribute("level") ? "level" : undefined;
        let c = _accessory.getOrAddService(_service).getCharacteristic(Characteristic.Volume);
        let lastVolumeWriteValue = null;
        if (!c._events.get || !c._events.set) {
            if (!c._events.get) {
                c.on("get", (callback) => {
                    callback(null, this.transforms.transformAttributeState(lvlAttr, _accessory.context.deviceData.attributes[lvlAttr]) || 0);
                });
            }
            if (!c._events.set) {
                c.on("set", (value, callback) => {
                    if (isSonos) {
                        if (value > 0 && value !== lastVolumeWriteValue) {
                            lastVolumeWriteValue = value;
                            this.logDebug(`Existing volume: ${_accessory.context.deviceData.attributes.volume}, set to ${lastVolumeWriteValue}`);
                            _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, "setVolume", {
                                value1: lastVolumeWriteValue,
                            });
                        }
                    }
                    if (value > 0) {
                        _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, this.accessories.transformCommandName(lvlAttr, value), {
                            value1: this.transforms.transformAttributeState(lvlAttr, value),
                        });
                    }
                });
            }
            this.accessories.storeCharacteristicItem("volume", _accessory.context.deviceData.deviceid, c);
        }
        _accessory
            .getOrAddService(_service)
            .getCharacteristic(Characteristic.Volume)
            .updateValue(this.transforms.transformAttributeState(lvlAttr, _accessory.context.deviceData.attributes[lvlAttr]) || 0);
        if (_accessory.hasCapability("Audio Mute")) {
            _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.Mute, "mute");
        }

        _accessory.context.deviceGroups.push("speaker_device");
        return _accessory;
    }

    switch_device(_accessory, _service) {
        _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.On, "switch");
        _accessory.context.deviceGroups.push("switch");
        return _accessory;
    }

    temperature_sensor(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CurrentTemperature, "temperature", {
            props: {
                minValue: -100,
                maxValue: 200,
            },
        });
        if (_accessory.hasCapability("Tamper Alert")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        } else {
            _accessory.getOrAddService(_service).removeCharacteristic(Characteristic.StatusTampered);
        }
        _accessory.context.deviceGroups.push("temperature_sensor");
        return _accessory;
    }

    thermostat(_accessory, _service) {
        //TODO:  Still seeing an issue when setting mode from OFF to HEAT.  It's setting the temp to 40 but if I change to cool then back to heat it sets the correct value.
        const tstatService = _accessory.getOrAddService(_service);
        let curTempChar = tstatService.getCharacteristic(Characteristic.CurrentTemperature);
        let curHeatCoolStateChar = tstatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState);
        let targetHeatCoolStateChar = tstatService.getCharacteristic(Characteristic.TargetHeatingCoolingState);
        let targetTempChar = tstatService.getCharacteristic(Characteristic.TargetTemperature);

        // CURRENT HEATING/COOLING STATE
        if (!curHeatCoolStateChar._events.get) {
            curHeatCoolStateChar.on("get", (callback) => {
                const state = this.transforms.transformAttributeState("thermostatOperatingState", _accessory.context.deviceData.attributes.thermostatOperatingState);
                callback(null, state);
            });
            this.accessories.storeCharacteristicItem("thermostatOperatingState", _accessory.context.deviceData.deviceid, curHeatCoolStateChar);
        } else {
            curHeatCoolStateChar.updateValue(this.transforms.transformAttributeState("thermostatOperatingState", _accessory.context.deviceData.attributes.thermostatOperatingState));
        }

        // TARGET HEATING/COOLING STATE
        if (!targetHeatCoolStateChar._events.get || !targetHeatCoolStateChar._events.set) {
            targetHeatCoolStateChar.setProps({
                validValues: this.transforms.thermostatSupportedModes(_accessory.context.deviceData),
            });
            if (!targetHeatCoolStateChar._events.get) {
                targetHeatCoolStateChar.on("get", (callback) => {
                    // console.log('thermostatMode(get): ', this.transforms.transformAttributeState('thermostatMode', _accessory.context.deviceData.attributes.thermostatMode));
                    callback(null, this.transforms.transformAttributeState("thermostatMode", _accessory.context.deviceData.attributes.thermostatMode));
                });
            }
            if (!targetHeatCoolStateChar._events.set) {
                targetHeatCoolStateChar.on("set", async (value, callback) => {
                    let state = this.transforms.transformCommandValue("thermostatMode", value);
                    _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, this.transforms.transformCommandName("thermostatMode", value), {
                        value1: state,
                    });
                    _accessory.context.deviceData.attributes.thermostatMode = state;
                    // targetTempChar.updateValue(this.transforms.thermostatTargetTemp(_accessory.context.deviceData));
                });
            }
            this.accessories.storeCharacteristicItem("thermostatMode", _accessory.context.deviceData.deviceid, targetHeatCoolStateChar);
        } else {
            targetHeatCoolStateChar.updateValue(this.transforms.transformAttributeState("thermostatMode", _accessory.context.deviceData.attributes.thermostatMode));
        }

        // CURRENT RELATIVE HUMIDITY
        if (_accessory.hasCapability("Relative Humidity Measurement")) {
            _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CurrentRelativeHumidity, "humidity");
        }

        // CURRENT TEMPERATURE
        if (!curTempChar._events.get) {
            curTempChar.on("get", (callback) => {
                // targetTempChar.updateValue(this.transforms.thermostatTargetTemp(_accessory.context.deviceData));
                callback(null, this.transforms.thermostatTempConversion(_accessory.context.deviceData.attributes.temperature));
            });
            this.accessories.storeCharacteristicItem("temperature", _accessory.context.deviceData.deviceid, curTempChar);
            this.accessories.storeCharacteristicItem("thermostatSetpoint", _accessory.context.deviceData.deviceid, targetTempChar);
        } else {
            curTempChar.updateValue(this.transforms.transformAttributeState("temperature", _accessory.context.deviceData.attributes.temperature));
        }

        // TARGET TEMPERATURE
        if (!targetTempChar._events.get || !targetTempChar._events.set) {
            if (!targetTempChar._events.get) {
                targetTempChar.on("get", (callback) => {
                    const targetTemp = this.transforms.thermostatTargetTemp(_accessory.context.deviceData);
                    // console.log('targetTemp:', targetTemp);
                    callback(null, targetTemp ? this.transforms.thermostatTempConversion(targetTemp) : null);
                });
            }
            if (!targetTempChar._events.set) {
                targetTempChar.on("set", (value, callback) => {
                    // Convert the Celsius value to the appropriate unit for Hubitat
                    let temp = this.transforms.thermostatTempConversion(value, true);
                    const targetObj = this.transforms.thermostatTargetTemp_set(_accessory.context.deviceData);
                    if (targetObj && targetObj.cmdName && targetObj.attrName && temp) {
                        _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, targetObj.cmdName, {
                            value1: temp,
                        });
                        _accessory.context.deviceData.attributes[targetObj.attrName] = temp;
                    }
                });
            }
            this.accessories.storeCharacteristicItem("coolingSetpoint", _accessory.context.deviceData.deviceid, targetTempChar);
            this.accessories.storeCharacteristicItem("heatingSetpoint", _accessory.context.deviceData.deviceid, targetTempChar);
            this.accessories.storeCharacteristicItem("thermostatSetpoint", _accessory.context.deviceData.deviceid, targetTempChar);
        } else {
            const targetTemp = this.transforms.thermostatTargetTemp(_accessory.context.deviceData);
            targetTempChar.updateValue(targetTemp ? this.transforms.thermostatTempConversion(targetTemp) : null);
        }

        // TEMPERATURE DISPLAY UNITS
        let tempUnitChar = tstatService.getCharacteristic(Characteristic.TemperatureDisplayUnits);
        tempUnitChar.updateValue(this.platform.getTempUnit() === "F" ? Characteristic.TemperatureDisplayUnits.FAHRENHEIT : Characteristic.TemperatureDisplayUnits.CELSIUS);

        // HEATING THRESHOLD TEMPERATURE
        if (targetHeatCoolStateChar.props.validValues.includes(3)) {
            // console.log('test', targetHeatCoolStateChar.props);
            let heatThreshTempChar = tstatService.getCharacteristic(Characteristic.HeatingThresholdTemperature);
            let coolThreshTempChar = tstatService.getCharacteristic(Characteristic.CoolingThresholdTemperature);
            if (!heatThreshTempChar._events.get || !heatThreshTempChar._events.set) {
                if (!heatThreshTempChar._events.get) {
                    heatThreshTempChar.on("get", (callback) => {
                        console.log("heatingSetpoint: ", _accessory.context.deviceData.attributes.heatingSetpoint);
                        callback(null, this.transforms.thermostatTempConversion(_accessory.context.deviceData.attributes.heatingSetpoint));
                    });
                }
                if (!heatThreshTempChar._events.set) {
                    heatThreshTempChar.on("set", (value, callback) => {
                        // Convert the Celsius value to the appropriate unit for Hubitat
                        let temp = this.transforms.thermostatTempConversion(value, true);
                        _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, "setHeatingSetpoint", {
                            value1: temp,
                        });
                        _accessory.context.deviceData.attributes.heatingSetpoint = temp;
                    });
                }
                this.accessories.storeCharacteristicItem("heatingSetpoint", _accessory.context.deviceData.deviceid, heatThreshTempChar);
                this.accessories.storeCharacteristicItem("thermostatSetpoint", _accessory.context.deviceData.deviceid, heatThreshTempChar);
            } else {
                heatThreshTempChar.updateValue(this.transforms.thermostatTempConversion(_accessory.context.deviceData.attributes.heatingSetpoint));
            }

            // COOLING THRESHOLD TEMPERATURE
            if (!coolThreshTempChar._events.get || !coolThreshTempChar._events.set) {
                if (!coolThreshTempChar._events.get) {
                    coolThreshTempChar.on("get", (callback) => {
                        console.log("coolingSetpoint: ", _accessory.context.deviceData.attributes.coolingSetpoint);
                        callback(null, this.transforms.thermostatTempConversion(_accessory.context.deviceData.attributes.coolingSetpoint));
                    });
                }
                if (!coolThreshTempChar._events.set) {
                    coolThreshTempChar.on("set", (value, callback) => {
                        // Convert the Celsius value to the appropriate unit for Hubitat
                        let temp = this.transforms.thermostatTempConversion(value, true);
                        _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, "setCoolingSetpoint", {
                            value1: temp,
                        });
                        _accessory.context.deviceData.attributes.coolingSetpoint = temp;
                    });
                }
                this.accessories.storeCharacteristicItem("coolingSetpoint", _accessory.context.deviceData.deviceid, coolThreshTempChar);
                this.accessories.storeCharacteristicItem("thermostatSetpoint", _accessory.context.deviceData.deviceid, coolThreshTempChar);
            } else {
                coolThreshTempChar.updateValue(this.transforms.thermostatTempConversion(_accessory.context.deviceData.attributes.coolingSetpoint));
            }
        } else {
            tstatService.removeCharacteristic(Characteristic.HeatingThresholdTemperature);
            tstatService.removeCharacteristic(Characteristic.CoolingThresholdTemperature);
        }
        _accessory.context.deviceGroups.push("thermostat");
        return _accessory;
    }

    thermostat_fan(_accessory, _service) {
        _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.Active, "thermostatFanMode");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CurrentFanState, "thermostatFanMode", {
            get_altAttr: "fanState",
        });
        _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.TargetFanState, "thermostatFanMode", {
            get_altAttr: "thermostatFanModeTarget",
        });
        _accessory.context.deviceGroups.push("thermostat_fan");
        return _accessory;
    }

    valve(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.InUse, "valve");
        _accessory.manageGetSetCharacteristic(_service, _accessory, Characteristic.Active, "valve");
        if (!_accessory.hasCharacteristic(_service, Characteristic.ValveType)) _accessory.getOrAddService(_service).setCharacteristic(Characteristic.ValveType, 0);

        _accessory.context.deviceGroups.push("valve");
        return _accessory;
    }

    virtual_mode(_accessory, _service) {
        let c = _accessory.getOrAddService(_service).getCharacteristic(Characteristic.On);
        if (!c._events.get || !c._events.set) {
            if (!c._events.get)
                c.on("get", (callback) => {
                    callback(null, this.transforms.transformAttributeState("switch", _accessory.context.deviceData.attributes.switch));
                });
            if (!c._events.set)
                c.on("set", (value, callback) => {
                    if (value && _accessory.context.deviceData.attributes.switch === "off") {
                        _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, "mode");
                    }
                });
            this.accessories.storeCharacteristicItem("switch", _accessory.context.deviceData.deviceid, c);
        } else {
            c.updateValue(this.transforms.transformAttributeState("switch", _accessory.context.deviceData.attributes.switch));
        }
        _accessory.context.deviceGroups.push("virtual_mode");
        return _accessory;
    }

    virtual_piston(_accessory, _service) {
        let c = _accessory.getOrAddService(_service).getCharacteristic(Characteristic.On);
        if (!c._events.get || !c._events.set) {
            if (!c._events.get)
                c.on("get", (callback) => {
                    callback(null, false);
                });
            if (!c._events.set)
                c.on("set", (value, callback) => {
                    if (value) {
                        _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, "piston");
                        setTimeout(() => {
                            // console.log("pistonOff...");
                            _accessory.context.deviceData.attributes.switch = "off";
                            c.updateValue(false);
                        }, 1000);
                    }
                });
            this.accessories.storeCharacteristicItem("switch", _accessory.context.deviceData.deviceid, c);
        } else {
            c.updateValue(this.transforms.transformAttributeState("switch", _accessory.context.deviceData.attributes.switch));
        }
        _accessory.context.deviceGroups.push("virtual_piston");
        return _accessory;
    }

    virtual_routine(_accessory, _service) {
        let c = _accessory.getOrAddService(_service).getCharacteristic(Characteristic.On);
        if (!c._events.get || !c._events.set) {
            if (!c._events.get)
                c.on("get", (callback) => {
                    callback(null, false);
                });
            if (!c._events.set)
                c.on("set", (value, callback) => {
                    if (value) {
                        _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, "routine");
                        setTimeout(() => {
                            console.log("routineOff...");
                            _accessory.context.deviceData.attributes.switch = "off";
                            c.updateValue(false);
                        }, 1000);
                    }
                });
            this.accessories.storeCharacteristicItem("switch", _accessory.context.deviceData.deviceid, c);
        } else {
            c.updateValue(this.transforms.transformAttributeState("switch", _accessory.context.deviceData.attributes.switch));
        }
        _accessory.context.deviceGroups.push("virtual_routine");
        return _accessory;
    }

    water_sensor(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.LeakDetected, "water");
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusActive, "status");
        if (_accessory.hasCapability("Tamper Alert")) _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.StatusTampered, "tamper");
        _accessory.context.deviceGroups.push("water_sensor");
        return _accessory;
    }

    window_shade(_accessory, _service) {
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.CurrentPosition, _accessory.hasCommand("setPosition") ? "position" : "level", {
            props: {
                steps: 10,
            },
        });
        let c = _accessory.getOrAddService(_service).getCharacteristic(Characteristic.TargetPosition);
        if (!c._events.get || !c._events.set) {
            if (!c._events.get) {
                c.on("get", (callback) => {
                    callback(null, parseInt(_accessory.hasCommand("setPosition") ? _accessory.context.deviceData.attributes.position : _accessory.context.deviceData.attributes.level));
                });
            }
            if (!c._events.set) {
                c.on("set", (value, callback) => {
                    if (_accessory.hasCommand("close") && value <= 2) {
                        _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, "close");
                    } else {
                        let v = value;
                        if (value <= 2) v = 0;
                        if (value >= 98) v = 100;
                        _accessory.sendCommand(callback, _accessory, _accessory.context.deviceData, _accessory.hasCommand("setPosition") ? "setPosition" : "setLevel", {
                            value1: v,
                        });
                    }
                });
            }
            this.accessories.storeCharacteristicItem(_accessory.hasCommand("setPosition") ? "position" : "level", _accessory.context.deviceData.deviceid, c);
        } else {
            c.updateValue(this.transforms.transformAttributeState(_accessory.hasCommand("setPosition") ? "position" : "level", _accessory.hasCommand("setPosition") ? _accessory.context.deviceData.attributes.position : _accessory.context.deviceData.attributes.level));
        }
        _accessory.manageGetCharacteristic(_service, _accessory, Characteristic.PositionState, "windowShade");
        _accessory.getOrAddService(_service).getCharacteristic(Characteristic.ObstructionDetected).updateValue(false);
        _accessory.getOrAddService(_service).getCharacteristic(Characteristic.HoldPosition).updateValue(false);
        _accessory.context.deviceGroups.push("window_shade");
        return _accessory;
    }
};
