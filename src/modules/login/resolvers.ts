import { compare } from 'bcryptjs';
import { ResolverMap } from '../../types/graphql-utils';
import { User } from '../../entity/User';
import { invalidLoginOrPass, needConfirmEmail } from './errorMessages';

const errorResponse = [{ path: 'email', message: invalidLoginOrPass }];

export const resolvers: ResolverMap = {
    Query: {
        test2: () => 'test2'
    },
    Mutation: {
        login: async (_, { email, password }: GQL.ILoginOnMutationArguments, { session }) => {
            const user = await User.findOne({ where: { email } });

            if (!user) return errorResponse;

            if (!user.isConfirmed) return [{ path: 'email', message: needConfirmEmail }];

            const isValidPass = await compare(password, user.password);

            if (!isValidPass) return errorResponse;

            // login successful
            session.userId = user.id;

            return null;
        }
    }
};