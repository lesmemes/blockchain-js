import { ProgramState } from './model'
import { Injectable } from '@angular/core';

@Injectable()
export class State {
    userId: string = "ltearno@gmail.com"

    programState: ProgramState = {
        redistributableItems: [
            "pixel-red",
            "pixel-green",
            "pixel-blue",
            "pixel-purple",
            "emoji-😁",
            "emoji-💛",
            "emoji-🎷",
            "artwork-oiuyhkjh"
        ],

        accounts: {
            "ltearno@gmail.com": {
                email: "ltearno@gmail.com",
                inventory: {
                    'pixel-red': 20,
                    'pixel-green': 3,
                    'emoji-😁': 5,
                    'artwork-oiuyhkjh': 1,
                    'artwork-klkjhf': 2
                }
            },

            "biloute@gmail.com": {
                email: "biloute@gmail.com",
                inventory: {
                    'pixel-blue': 20,
                    'pixel-red': 3,
                    'emoji-💛': 5,
                    'artwork-swujb': 3
                }
            },

            "lalali@gmail.com": {
                email: "lalali@gmail.com",
                inventory: {
                    'pixel-red': 3,
                    'emoji-🎷': 5,
                    'artwork-swujb': 3
                }
            },

            "lolite": {
                email: "lolite",
                inventory: {
                    'pixel-purple': 3,
                    'emoji-🎷': 5,
                    'artwork-swujb': 3
                }
            }
        },

        artWorks: {
            'klkjhf': {
                id: 'klkjhf',
                author: 'me',
                title: 'Ile paradisiaque',
                description: 'On souhaite créer une ile où il fait bon vivre. Proposez des zones interressantes et variées !',
                validated: false,
                messages: [],
                size: { width: 10, height: 10 },
                grid: [
                    null, { ownerId: null, workItemId: 'pixel-green' }, null, null, { ownerId: null, workItemId: 'emoji-😁' }, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null,
                    null, null, null, { ownerId: 'lolite', workItemId: 'artwork-swujb' }, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null,
                    null, null, null, { ownerId: null, workItemId: 'emoji-💛' }, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null,
                    null, { ownerId: 'lolite', workItemId: 'artwork-oiuyhkjh' }, null, null, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null,
                    null, null, null, null, null, null, null, null, null, null
                ]
            },

            'swujb': {
                id: 'swujb',
                author: 'lolite',
                title: 'Hopitâl',
                description: 'Un grand H en noir sur blanc, contribuez par des lots noirs.',
                validated: false,
                messages: [],
                size: { width: 5, height: 5 },
                grid: [
                    { ownerId: null, workItemId: 'artwork-oiuyhkjh' }, null, null, null, null,
                    null, { ownerId: 'lolite', workItemId: 'artwork-oiuyhkjh' }, null, null, null,
                    null, null, { ownerId: null, workItemId: 'artwork-oiuyhkjh' }, null, null,
                    null, null, null, null, { ownerId: 'lolite', workItemId: 'artwork-oiuyhkjh' },
                    null, null, null, null, { ownerId: 'lolite', workItemId: 'artwork-oiuyhkjh' }
                ]
            },

            'iauydg': {
                id: 'iauydg',
                author: 'ltearno@gmail.com',
                title: 'Super Man',
                description: 'Superman version pixels',
                validated: false,
                messages: [],
                size: { width: 5, height: 5 },
                grid: [
                    { ownerId: null, workItemId: 'pixel-red' }, null, null, null, null,
                    null, { ownerId: null, workItemId: 'pixel-red' }, null, null, null,
                    null, null, { ownerId: null, workItemId: 'pixel-red' }, null, null,
                    null, null, null, null, { ownerId: null, workItemId: 'pixel-red' },
                    null, null, null, null, { ownerId: null, workItemId: 'pixel-red' }
                ]
            },

            'oiuyhkjh': {
                id: 'oiuyhkjh',
                author: 'me',
                title: 'My forst artwirk',
                description: 'Un test',
                validated: true,
                messages: [],
                size: { width: 3, height: 3 },
                grid: [
                    { ownerId: 'lolite', workItemId: 'pixel-red' }, { ownerId: 'lolite', workItemId: 'pixel-red' }, { ownerId: 'lolite', workItemId: 'emoji-😁' },
                    { ownerId: 'lolite', workItemId: 'pixel-red' }, { ownerId: 'lolite', workItemId: 'pixel-white' }, { ownerId: 'lolite', workItemId: 'pixel-red' },
                    { ownerId: 'lolite', workItemId: 'emoji-😁' }, { ownerId: 'lolite', workItemId: 'pixel-red' }, { ownerId: 'lolite', workItemId: 'emoji-😂' }
                ]
            }
        }
    }
}