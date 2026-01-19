import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function checkAndFixUsers() {
    try {
        console.log('🔍 Checking all users in the database...\n');

        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                password: true,
                schoolId: true,
            },
            take: 20,
        });

        if (users.length === 0) {
            console.log('❌ No users found in database!');
            console.log('You need to create users first.');
            return;
        }

        console.log(`Found ${users.length} users:\n`);

        for (const user of users) {
            console.log(`📧 Email: ${user.email}`);
            console.log(`   Name: ${user.name}`);
            console.log(`   Role: ${user.role}`);
            console.log(`   School ID: ${user.schoolId || 'None'}`);
            console.log(`   Password Hash: ${user.password.substring(0, 20)}...`);
            console.log(`   Password starts with $2: ${user.password.startsWith('$2')}`);
            console.log('');
        }

        // Check for plain text passwords
        const plainTextUsers = users.filter(u => !u.password.startsWith('$2'));

        if (plainTextUsers.length > 0) {
            console.log(`\n⚠️  WARNING: Found ${plainTextUsers.length} users with plain text passwords!`);
            console.log('These users need their passwords hashed.\n');

            for (const user of plainTextUsers) {
                console.log(`Fixing password for: ${user.email}`);
                const hashedPassword = await hash(user.password, 10);
                await prisma.user.update({
                    where: { id: user.id },
                    data: { password: hashedPassword },
                });
                console.log(`✅ Fixed password for ${user.email}`);
            }
        } else {
            console.log('✅ All passwords are properly hashed!');
        }

        console.log('\n📝 Test credentials you can use:');
        users.slice(0, 5).forEach(user => {
            console.log(`   Email: ${user.email}`);
            console.log(`   Role: ${user.role}`);
            console.log('');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAndFixUsers();
