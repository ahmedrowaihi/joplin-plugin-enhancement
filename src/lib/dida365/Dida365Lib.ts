import fetch from 'node-fetch';
import {DIDA_COOKIE} from "../../../dev_commons";

const DIDA_JOPLIN_PROJECT_NAME = 'Joplin';

/**
 * It contains many attributes, but we only care about the following ones.
 */
export class DidaProject {
    id: string;
    name: string;
}

export class DidaTask {
    id: string;
    projectId: string;
    title: string;
    status: number;
    items: DidaSubTask[];

    setFinished(isFinished) {
        if (isFinished) {
            this.status = 2;
        } else {
            this.status = 0;
        }
    }
}

export class DidaSubTask {
    id: string;
    title: string;
    status: number;

    setFinished(isFinished) {
        if (isFinished) {
            this.status = 2;
        } else {
            this.status = 0;
        }
    }
}

export class DidaReminder {

}


class Dida365Lib {
    cookie: string;
    joplinProjectId: string;
    checkPoint: number;

    constructor() {
        this.cookie = DIDA_COOKIE;
        this.checkPoint = 0;
    }

    async init() {
        this.joplinProjectId = await this.getJoplinProjectId();
        console.log('Dida365Lib: joplin project id =', this.joplinProjectId);
    }

    headers() {
        return {
            cookie: this.cookie,
            'Content-Type': 'application/json;charset=UTF-8',
            'x-device': '{"platform":"web","device":"Chrome 102.0.5005.49","name":"","version":4216,","channel":"website","campaign":""}'
        }
    }

    async pushRegister(token: string) {
        const requestUrl = `https://api.dida365.com/api/v2/push/register`;
        const response = await fetch(requestUrl, {
            headers: this.headers(),
            method: 'POST',
            body: JSON.stringify({
                'pushToken': token,
                'osType': 41
            })
        });
        if (response.ok) {
            const resJson = await response.json();
            console.log('Dida365Lib: push register successfully');
        } else {
            console.error('Dida365Lib: push register failed')
        }
    }

    async createJoplinProject() {
        const requestUrl = `https://api.dida365.com/api/v2/project`;
        const response = await fetch(requestUrl, {
            headers: this.headers(),
            method: 'POST',
            body: JSON.stringify({
                "name": DIDA_JOPLIN_PROJECT_NAME,
                "color": "#3876E4",
                "groupId": null,
                "sortOrder": -8070452868710138000,
                "inAll": true,
                "muted": false,
                "teamId": null,
                "kind": "TASK",
                "isOwner": true
            })
        });
        if (response.ok) {
            const resJson = await response.json();
            console.log(resJson);
            return resJson.id;
        }

        return null;
    }

    async getProjects(): Promise<DidaProject[]> {
        let projects: DidaProject[] = [];
        const requestUrl = `https://api.dida365.com/api/v2/projects`;
        const response = await fetch(requestUrl, { headers: this.headers() });
        if (response.ok) {
            const resJson = await response.json();
            for (let project of resJson) {
                let pItem = new DidaProject();
                pItem.id = project.id;
                pItem.name = project.name;
                projects.push(pItem);
            }
            return projects;
        }

        return projects;
    }

    async getTask(taskId): Promise<DidaSubTask[]> {
        const requestUrl = `https://api.dida365.com/api/v2/task/${taskId}`;
        let tasks: DidaSubTask[] = [];
        const response = await fetch(requestUrl, { headers: this.headers() });
        if (response.ok) {
            const resJson = await response.json();
            for (let taskJson of resJson) {
                let task = new DidaSubTask();
                task.id = taskJson.id;
                task.title = taskJson.title;
                tasks.push(task);
            }
            return tasks;
        }

        return tasks;
    }

    async getJoplinProjectId() {
        const projects = await this.getProjects();
        if (projects) {
            for (let project of projects) {
                if (project.name === DIDA_JOPLIN_PROJECT_NAME) {
                    return project.id;
                }
            }

            return await this.createJoplinProject();
        }
    }

    async updateJoplinTask(
        taskId: string,             // dida task id. It should be stored as the source_url attribute of each note
        taskTitle: string,          // dida task title. It should be the same as the note title
        subTasks: DidaSubTask[]        // sub dida tasks
    ) {
        let subItems = [];
        for (let subTask of subTasks) {
            subItems.push({
                "id": subTask.id,
                "title": subTask.title
            });
        }

        let changeBody = {
            "items": subItems,
            "title": taskTitle,
            "projectId": this.joplinProjectId,
            "id": taskId,
        };

        const requestUrl = `https://api.dida365.com/api/v2/task/${taskId}`;
        const response = await fetch(requestUrl, {
            headers: this.headers(),
            method: 'POST',
            body: JSON.stringify(changeBody)
        });
        if (response.ok) {
            console.log('Dida365Lib: update successfully')
        } else {
            console.log('Dida365Lib: update failed')
        }
    }

    async getJoplinTasks() {
        const requestUrl = `https://api.dida365.com/api/v2/project/${this.joplinProjectId}/tasks`;
        const response = await fetch(requestUrl, { headers: this.headers() });
        if (response.ok) {
            const resJson = await response.json();



        }
    }

    async batchCheckGet(checkPoint) {
        const requestUrl = `https://api.dida365.com/api/v2/batch/check/0`;
        const response = await fetch(requestUrl, { headers: this.headers() });
        if (response.ok) {
            const resJson = await response.json();
            this.checkPoint = resJson.checkPoint;


        }
    }
}

export const Dida365 = new Dida365Lib();
