import { Injectable, OnDestroy } from '@angular/core';
import { Config } from '../config';
import { Event } from './event';
import { Token } from './token/token';
import { HttpHeaders, HttpParams } from '@angular/common/http';

@Injectable()
export class Http implements OnDestroy {
  /**
   * Create a new instance of the service.
   */
  constructor(
    public config: Config,
    public event: Event,
    public token: Token
  ) {
    this.eventListeners();
  }

  /**
   * Assignable base url for http calls.
   */
  baseUrl: string = '';

  /**
   * Headers to be sent with all http calls.
   */
  public headers: HttpHeaders = new HttpHeaders();

  /**
   * The promise that wraps credential setting.
   */
  settingCredentials: Promise<void>;

  /**
   * The subsciptions of the service.
   */
  subs: any = {};

  /**
   * On service destroy.
   */
  ngOnDestroy(): void {
    Object.keys(this.subs).forEach(k => this.subs[k].unsubscribe());
  }

  /**
   * Build url parameters for requests.
   */
  buildParams(params: any): HttpParams {
    var query_params = new HttpParams();

    if (params) {
      Object.keys(params).forEach((key: any) => {
        if (params[key]) query_params.set(key, params[key]);
      });
    }

    return query_params;
  }

  /**
   * Event listeners.
   */
  private eventListeners(): void {
    if (this.event) {
      let sub = () => {
        this.settingCredentials = new Promise(async (resolve) => {
          await this.setDefaultHeaders();
          resolve();
        });

        this.settingCredentials.then(() => {
          this.settingCredentials = null;
        });
      };

      this.subs['auth:loggingIn'] = this.event.listen('auth:loggingIn').subscribe(sub);
      this.subs['auth:loggedOut'] = this.event.listen('auth:loggedOut').subscribe(sub);
      this.subs['auth:check'] = this.event.listen('auth:check').subscribe(sub);
    }
  }

  /**
   * Get url for http request.
   */
  public getUrl(url: string): string {
    if (url.startsWith('/') || url.startsWith('http')) return url;

    let baseUrl = this.baseUrl || this.config.get('http.baseUrl') || '';

    return (baseUrl) ? baseUrl + '/' + url : url;
  }

  /**
   * Set the default headers for http request.
   */
  async setDefaultHeaders(): Promise<void> {
    let configHeaders = (this.config) ? this.config.get('http.headers') : null;

    if (configHeaders) {
      Object.keys(configHeaders).forEach(key => {
        this.headers = this.headers.set(key, configHeaders[key] || '');
      });
    }

    await this.tokenHeader();
  }

  /**
   * Add a token header to the request.
   */
  async tokenHeader(): Promise<any> {
    try {
      const token = await this.token.get();
      let scheme = this.config.get('token.scheme');
      let value = (scheme) ? `${scheme} ${token}` : token;
      this.headers = this.headers.set('Authorization', value || '');

      return token ? true : false;
    } catch (error) {
      this.headers = this.headers.delete('Authorization');

      return false;
    }
  }
}
