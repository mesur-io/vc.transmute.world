const request = require('supertest');

const { getFastify } = require('../../../factory');
const config = require('../../../config');

const opts = {
    logger: false,
    config,
};

const { fastify } = getFastify(opts);

const bindingModel = require('../../../__fixtures__/cmtr/vc.bindingModel.json');

let tester;


jest.setTimeout(10 * 1000);

describe('issuer', () => {
    beforeAll(async () => {
        await fastify.ready();
        const port = fastify.svcs.config.fastify_base_url.split(':').pop();
        try {
            await fastify.listen(port);
        } catch (e) {
            // ignore
        }
        tester = request(fastify.server);
    });

    afterAll(async () => {
        await fastify.close();
    });

    describe('issue', () => {
        it('should return a vc with proof', async () => {
            const res = await tester
                .post('/api/v0/issuer/issue')
                .set('Accept', 'application/json')
                .send(bindingModel);
            expect(res.status).toBe(200);
            // console.log(JSON.stringify(res.body, null, 2))
            expect(res.body.proof).toBeDefined();
        });
    });
});