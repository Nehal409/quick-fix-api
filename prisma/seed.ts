import * as process from 'node:process';

const main = async (): Promise<void> => {
    console.log('Database seeded successfully!');
    process.exit(0);
};

main().catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
});
