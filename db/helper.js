'use strict';

const sqlite = require('sqlite3'); // .verbose();
const log = require('fancy-log');
const appConfig = require.main.require('../config/appConfig');
const cv = require.main.require('../config/console');

/**
 * Предоставляет интерфейс взаимодействия с БД.
 *
 * @class DBHelper
 */
class DBHelper {
    /**
     *Creates an instance of DBHelper.
     * @param {Object} [opts={ autoclose: true, autoopen: true }] автоматическое закрытие соединения: истина, автоматическое открытие соединения: истина
     * @memberof DBHelper
     */
    constructor (opts = { autoclose: true, autoopen: true }) {
        this._path = `./database/${appConfig.dbName}.db`;
        this._db = null;
        this._autoclose = opts.autoclose;
        this._autoopen = opts.autoopen;
        this._status = {
            closed: true,
            opened: false
        };

        return this;
    }

    /**
     * Создает соединение с БД.
     *
     * @returns {Promise.<Void, Error>} При успешном соединении ничего не возвращает.В противном случае возвращает сообщение об ошибке.
     * @memberof DBHelper
     */
    async open () {
        let self = this;
        return new Promise((resolve, reject) => {
            this._db = new sqlite.Database(this._path, sqlite.OPEN_READWRITE, e => {
                log(e ? `${cv.BgRed}[APP] ERROR::${e.code}[${e.errno}][${e.message}]${cv.Reset}` : `${cv.BgGreen}[APP] SUCCESS::Connected to database${cv.Reset}`);
                e ? reject(e) : resolve();
                self._status = e ? { opened: false, closed: true } : { opened: true, closed: false };
                self._setTimeout();
            });
        });
    }

    /**
     * Закрывает соединение с БД.
     *
     * @returns {Promise.<Void, Error>} При успешном отключении ничего не возвращает.В противном случае возвращает сообщение об ошибке.
     * @memberof DBHelper
     */
    async close () {
        let self = this;
        return new Promise((resolve, reject) => {
            this._db.close(e => {
                log(e ? `${cv.BgRed}[APP] ERROR::${e.code}[${e.errno}][${e.message}]${cv.Reset}` : `${cv.BgGreen}[APP] SUCCESS::Database connection was closed ${cv.Reset}`);
                e ? reject(e) : resolve();
                self._status = e ? { opened: true, closed: false } : { opened: false, closed: true };
            });
        });
    }

    /**
     * Устанавливает время ожидания завершения работы с БД.
     *
     * @param {Number} time Время в миллисекундах.
     * @memberof DBHelper
     */
    _setTimeout (time) {
        this._db.configure('busyTimeout', time || appConfig.dbTimeout);
    }

    /**
     * Получает все записи из таблицы, удовлетворяющие заданным условиям.
     *
     * @param {String} sql Текст запроса.
     * @param {Array} [data=[]] Данные запроса.
     * @returns {Promise.<Array, Error>} Результрующая выборка.
     * @memberof DBHelper
     */
    all (sql, data = []) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            if (self._autoopen && self._status.closed) { try { await self.open(); } catch (e) { reject(e); } }
            this._db.all(sql, data, async function (e, r) {
                if (self._autoclose && self._status.opened) { try { await self.close(); } catch (e) { reject(e); } }
                e ? reject(e) : resolve(r);
            });
        });
    }

    /**
     * Выполняет произвольный запрос к БД.
     *
     * @param {String} sql Текст запроса.
     * @param {*} [data=[]] Данные запроса.
     * @returns {Promise.<Array, Error>} Результрующая выборка.
     * @memberof DBHelper
     */
    run (sql, data = []) {
        let self = this;
        return new Promise(async (resolve, reject) => {
            if (self._autoopen && self._status.closed) { try { await self.open(); } catch (e) { reject(e); } }
            this._db.run(sql, data, async function (e, r) {
                if (self._autoclose && self._status.opened) { try { await self.close(); } catch (e) { reject(e); } }
                e ? reject(e) : resolve(r || this);
            });
        });
    }
}

module.exports = DBHelper;
