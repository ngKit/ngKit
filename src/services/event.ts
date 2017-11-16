import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Injectable } from '@angular/core';

@Injectable()
export class Event {
    /**
     * Event channels.
     */
    static channels: Subject<any>[] = [];

    /**
     * Get an event listener.
     *
     * @param  {any} key
     * @return {Subject<any>}
     */
    static channel(key: any): Subject<any> {
        if (typeof Event.channels[key] === 'undefined') {
            Event.channels[key] = new Subject<any>();
        }

        return Event.channels[key];
    }

    /**
     * Set multiple event channels.
     *
     * @param {Array} events
     */
    setChannels(channels: string[]): void {
        channels.forEach((channel) => Event.channel(channel));
    }

    /**
     * Broadcast an event to a channel.
     *
     * @return {void}
     */
    broadcast(key: string, data = {}): Promise<any> {
        return Promise.resolve(Event.channel(key).next(data));
    }

    /**
     *  Listen on a channel for an event.s
     *
     * @param  {string} key
     * @return {Observable}
     */
    listen(key: string): Observable<any> {
        return Event.channel(key).asObservable();
    }
}
