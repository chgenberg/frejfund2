import prisma from './prisma';

interface LinkedInConnection {
  id: string;
  name: string;
  headline: string;
  profileUrl: string;
  sharedConnections?: number;
}

interface IntroPath {
  investor: string;
  path: LinkedInConnection[];
  strength: number; // 1 = direct, 2 = 2nd degree, 3 = 3rd degree
  recommendedConnector: LinkedInConnection;
  introMessage: string;
}

/**
 * Find warm intro paths to investors via LinkedIn connections
 * 
 * NOTE: This requires LinkedIn API OAuth integration
 * User must connect their LinkedIn account first
 */
export async function findWarmIntroPaths(
  userId: string,
  targetInvestorNames: string[]
): Promise<IntroPath[]> {
  // Step 1: Get user's LinkedIn access token
  const integration = await prisma.integration.findFirst({
    where: {
      userId,
      provider: 'linkedin',
      status: 'connected'
    }
  });

  if (!integration || !integration.accessToken) {
    throw new Error('LinkedIn not connected. Please connect LinkedIn in Settings.');
  }

  // Step 2: Fetch user's connections from LinkedIn API
  const connections = await fetchLinkedInConnections(integration.accessToken);

  // Step 3: For each target investor, find connection paths
  const introPaths: IntroPath[] = [];

  for (const investorName of targetInvestorNames) {
    const paths = await findPathsToInvestor(
      connections,
      investorName,
      integration.accessToken
    );

    if (paths.length > 0) {
      introPaths.push(...paths);
    }
  }

  // Step 4: Sort by strength (1st degree > 2nd degree > 3rd degree)
  introPaths.sort((a, b) => a.strength - b.strength);

  return introPaths;
}

/**
 * Fetch user's LinkedIn connections via API
 */
async function fetchLinkedInConnections(accessToken: string): Promise<LinkedInConnection[]> {
  try {
    // LinkedIn API v2: Get connections
    const response = await fetch('https://api.linkedin.com/v2/connections?q=viewer&projection=(elements*(to~(id,firstName,lastName,headline,publicProfileUrl)))', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch LinkedIn connections');
    }

    const data = await response.json();
    
    // Parse connections
    const connections: LinkedInConnection[] = data.elements?.map((elem: any) => ({
      id: elem.to?.id,
      name: `${elem.to?.firstName} ${elem.to?.lastName}`,
      headline: elem.to?.headline,
      profileUrl: elem.to?.publicProfileUrl
    })) || [];

    return connections;
  } catch (error) {
    console.error('Error fetching LinkedIn connections:', error);
    return [];
  }
}

/**
 * Find connection paths to a specific investor
 */
async function findPathsToInvestor(
  userConnections: LinkedInConnection[],
  investorName: string,
  accessToken: string
): Promise<IntroPath[]> {
  const paths: IntroPath[] = [];

  // Search for investor in user's direct connections (1st degree)
  const directMatch = userConnections.find(conn => 
    conn.name.toLowerCase().includes(investorName.toLowerCase()) ||
    conn.headline?.toLowerCase().includes(investorName.toLowerCase())
  );

  if (directMatch) {
    paths.push({
      investor: investorName,
      path: [directMatch],
      strength: 1,
      recommendedConnector: directMatch,
      introMessage: generateDirectIntroMessage(directMatch, investorName)
    });
    return paths; // If we have direct connection, no need to search further
  }

  // Search 2nd degree connections
  // For each of user's connections, check their connections
  for (const connection of userConnections.slice(0, 50)) { // Limit to avoid rate limits
    try {
      // Check if this connection is connected to the investor
      // Note: This requires additional LinkedIn API permissions
      const secondDegreeConnections = await fetch(
        `https://api.linkedin.com/v2/connections?q=viewer&projection=(elements*(to~(id,firstName,lastName,headline)))`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'X-RestLi-Profile-Id': connection.id // View connections as this person
          }
        }
      );

      if (secondDegreeConnections.ok) {
        const data = await secondDegreeConnections.json();
        const match = data.elements?.find((elem: any) => 
          `${elem.to?.firstName} ${elem.to?.lastName}`.toLowerCase().includes(investorName.toLowerCase())
        );

        if (match) {
          paths.push({
            investor: investorName,
            path: [
              connection,
              {
                id: match.to.id,
                name: `${match.to.firstName} ${match.to.lastName}`,
                headline: match.to.headline,
                profileUrl: match.to.publicProfileUrl
              }
            ],
            strength: 2,
            recommendedConnector: connection,
            introMessage: generateWarmIntroMessage(connection, investorName)
          });
        }
      }
    } catch (error) {
      // Skip if we can't access this person's connections
      continue;
    }
  }

  return paths;
}

/**
 * Generate message for direct intro (1st degree)
 */
function generateDirectIntroMessage(connection: LinkedInConnection, investorName: string): string {
  return `You're directly connected to ${connection.name}! Send them a message on LinkedIn or email directly.`;
}

/**
 * Generate warm intro request message (2nd degree)
 */
function generateWarmIntroMessage(connector: LinkedInConnection, investorName: string): string {
  return `Ask ${connector.name} for an introduction to ${investorName}. They're connected and can make a warm intro.`;
}

/**
 * ALTERNATIVE: Simpler approach without deep API access
 * Just check if user has mutual connections with investor
 */
export async function checkMutualConnections(
  userId: string,
  investorLinkedInUrl: string
): Promise<{
  hasMutualConnections: boolean;
  count?: number;
  connections?: LinkedInConnection[];
}> {
  try {
    const integration = await prisma.integration.findFirst({
      where: { userId, provider: 'linkedin', status: 'connected' }
    });

    if (!integration?.accessToken) {
      return { hasMutualConnections: false };
    }

    // LinkedIn API: Check mutual connections
    const response = await fetch(
      `https://api.linkedin.com/v2/connections?q=viewer&facets=List(network:(secondDegree))`,
      {
        headers: {
          'Authorization': `Bearer ${integration.accessToken}`
        }
      }
    );

    if (response.ok) {
      const data = await response.json();
      // Parse mutual connections
      // This is simplified - actual implementation depends on LinkedIn API response structure
      
      return {
        hasMutualConnections: true,
        count: data.mutualConnectionsCount || 0
      };
    }

    return { hasMutualConnections: false };
  } catch (error) {
    console.error('Error checking mutual connections:', error);
    return { hasMutualConnections: false };
  }
}

/**
 * Generate warm intro request email/message
 */
export async function generateWarmIntroRequest(
  connectorName: string,
  investorName: string,
  investorFirm: string,
  businessInfo: any
): Promise<string> {
  return `Hi ${connectorName},

Hope you're doing well! I'm reaching out because I saw you're connected to ${investorName} at ${investorFirm}.

I'm raising a seed round for ${businessInfo.name} (${businessInfo.industry}), and ${investorFirm}'s focus on ${businessInfo.industry} makes them a perfect fit. We have ${businessInfo.metrics || 'strong traction'} and are looking for strategic partners.

Would you be comfortable making a warm introduction? Happy to send you a forwardable blurb.

Thanks so much!
[Your name]

---

**Forwardable blurb:**
${investorName}, I wanted to introduce you to [Your name], founder of ${businessInfo.name}. They're building [1-sentence description] and have [key traction metric]. Given ${investorFirm}'s investments in [similar company], thought you'd find this interesting. Worth a conversation?`;
}
