import { compare } from 'bcryptjs';
import { ResolverMap } from '../../types/graphql-utils';
import { User } from '../../entity/User';
import { invalidLoginOrPass, needConfirmEmail, forgorPasswordLockedError } from './errorMessages';
import { USER_SESSION_ID_PREFIX } from '../../constants';

const errorResponse = [{ path: 'email', message: invalidLoginOrPass }];

export const resolvers: ResolverMap = {
    Mutation: {
        login: async (
            _,
            { email, password }: GQL.ILoginOnMutationArguments,
            { session, redis, req }
        ) => {
            const user = await User.findOne({ where: { email } });

            if (!user) return errorResponse;

            if (!user.isConfirmed) return [{ path: 'email', message: needConfirmEmail }];

            if (user.isForgotPasswordLocked)
                return [{ path: 'email', message: forgorPasswordLockedError }];

            const isValidPass = await compare(password, user.password);

            if (!isValidPass) return errorResponse;

            // login successful
            session.userId = user.id;
            if (req.sessionID) {
                await redis.lpush(`${USER_SESSION_ID_PREFIX}${user.id}`, req.sessionID);
            }

            return null;
        }
    }
};
