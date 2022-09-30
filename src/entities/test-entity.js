"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
exports.__esModule = true;
exports.Test = void 0;
var core_1 = require("@mikro-orm/core");
var Test = /** @class */ (function () {
    function Test(name) {
        this.name = name;
    }
    __decorate([
        (0, core_1.PrimaryKey)()
    ], Test.prototype, "_id");
    __decorate([
        (0, core_1.Property)()
    ], Test.prototype, "name");
    Test = __decorate([
        (0, core_1.Entity)()
    ], Test);
    return Test;
}());
exports.Test = Test;
