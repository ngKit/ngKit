import {Injectable} from '@angular/core';
import {ngKitConfig} from './../config';
import {ngKitHttp} from './http';
import {ngKitToken} from './token';
import {ngKitEvent} from './event';
import {Facebook} from './../decorators';
import {Observable, Subject} from 'rxjs';

export interface ngKitAuthentication {
    loginWithFacebook(): Promise<any>;
    handleFacebookLoginSuccess(res: any): Observable<any>;
    handleFacebookLoginError(error: any);
}

@Injectable()
@Facebook
export class ngKitAuthentication {

    /**
     * Storage provider.
     *
     * @type {localStorage}
     */
    storage: any;

    /**
     * Authorized user.
     *
     * @type {object}
     */
    authUser: any = null;

    protected channels: string[] = ['auth:login', 'auth:logout'];

    /**
     * Constructor.
     */
    constructor(
        public config: ngKitConfig,
        public event: ngKitEvent,
        public http: ngKitHttp,
        public token: ngKitToken
    ) {
        this.storage = localStorage;

        this.event.setChannels(this.channels);
    }

    /**
     * Send a login request.
     *
     * @param  {object} credentials
     * @param  {string} endpoint
     *
     * @return {Promise}
     */
    login(credentials: any, endpoint: string = ''): Promise<any> {
        endpoint = this.config.get('authentication.endpoints.login', endpoint);

        return new Promise((resolve, reject) => {
            this.http.post(endpoint, credentials).subscribe(
                res => this.storeTokenAndBroadcast(res).then(() => resolve(res)),
                error => reject(error)
            );
        });
    }

    /**
     * Store aut token and broadcast an event.
     *
     * @param  {any} res
     *
     * @return {Promise}
     */
    storeTokenAndBroadcast(res: any): Promise<any> {
        return new Promise((resolve) => {
            this.storeToken(this.token.read(res)).then(stored => {
                this.event.channel('auth:login').next(res);
                resolve(res);
            }, error => console.error(error));
        });
    }

    /**
     * Log user out.
     *
     * @return {boolean}
     */
    logout() {
        if (this.removeToken()) return true

        return false;
    }

    /**
     * Send a forgot password request.
     *
     * @param  {object}  credentials
     * @param  {string} endpoint
     *
     * @return {Promise}
     */
    forgotPassword(credentials: any, endpoint: string = ''): Promise<any> {
        endpoint = this.config.get('authentication.endpoints.forgotPassword', endpoint);

        return new Promise((resolve, reject) => {
            return this.http.post(endpoint, credentials)
                .subscribe(res => resolve(res), error => reject(error));
        });
    }

    /**
     * Send a register request.
     *
     * @param  {object} data
     * @param  {string} endpoint
     *
     * @return {Promise}
     */
    register(data, endpoint: string = ''): Promise<any> {
        endpoint = this.config.get('authentication.endpoints.register', endpoint);

        return new Promise((resolve, reject) => {
            return this.http.post(endpoint, data)
                .subscribe(res => resolve(res), error => reject(error));;
        });
    }

    /**
     * Check if user is logged in.
     *
     * @param  {string} endpoint
     *
     * @return {Promise}
     */
    check(endpoint: string = ''): Promise<boolean> {
        endpoint = this.config.get('authentication.endpoints.check', endpoint);

        return new Promise((resolve, reject) => {
            this.token.get().then((token) => {
                this.getUser(endpoint).then((res) => {
                    this.setUser(res.data);
                    resolve(true);
                }, () => resolve(false));
            }, () => resolve(false));
        });
    }

    /**
     * Log user out and redirect.
     *
     * @param {object} error
     *
     * @return {void}
     */
    reject(error): void {
        if (error.status == 401) {
            this.logout();

            // REVIEW: use authorization
            //this._redirect.next(error);
        }
    }

    /**
     * Get the current authenticated user.
     *
     * @return {object}
     */
    user() {
        return this.authUser;
    }

    /**
     * Set the current authenticated user.
     *
     * @return {void}
     */
    setUser(user): void {
        this.authUser = user;
    }

    /**
     * Get the current authenticated user.
     *
     * @param  {string} endpoint
     *
     * @return {object}
     */
    getUser(endpoint: string = ''): Promise<any> {
        endpoint = this.config.get('authentication.endpoints.getUser', endpoint);

        return new Promise((resolve, reject) => {
            this.http.get(endpoint)
                .subscribe(res => resolve(res), error => reject(error));
        });
    }

    /**
     * Store auth token in local storage.
     *
     * @param  {string} token
     *
     * @return {Promise}
     */
    storeToken(token, tokenName?: string): Promise<any> {
        return this.token.set(token, tokenName);
    }

    /**
     * Get the authorization token from local storage.
     *
     * @return {Promise}
     */
    getToken(tokenName?: string): Promise<any> {
        return this.token.get(tokenName);
    }

    /**
     * Remove the token from local storage.
     *
     * @return {boolean}
     */
    removeToken(tokenName?) {
        return this.token.remove(tokenName);
    }

    /**
     * Get the login details.
     *
     * @return {object}
     */
    getLoginDetails() {
        return new Promise((resolve, reject) => {

            this.storage.get('login_details').then(login_details => {
                if (login_details) {
                    login_details = JSON.parse(login_details);

                    resolve(login_details);
                }

                reject(false);
            });
        });
    }

    /**
     * Update Login details for a user
     *
     * @param {Object} login_details
     *
     * @return {boolean}
     */
    updateLogingDetails(login_details) {
        return new Promise((resolve, reject) => {

            this.storage.get('login_details').then(stored_login_details => {
                stored_login_details = JSON.parse(stored_login_details) || {};

                login_details = Object.assign(stored_login_details, login_details);

                this.storage.set('login_details', JSON.stringify(login_details));

                resolve(true);
            });
        });
    }
}
