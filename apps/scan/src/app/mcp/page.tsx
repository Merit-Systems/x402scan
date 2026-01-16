import { CopyCode } from '@/components/ui/copy-code';
import { Body, Heading } from '../_components/layout/page-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TextSeparator } from '@/components/ui/text-separator';
import { Clients } from './_components/clients/clients';
import { Chip } from './_components/chip';

export default function McpPage() {
  return (
    <Body>
      <Chip />
    </Body>
  );

  //   return (
  //     <>
  //       <Heading
  //         title="x402scan MCP"
  //         description="Make x402 requests from Claude Code, Cursor, and more."
  //       />
  //       <Body className="flex-1 h-0 grid grid-cols-1 md:grid-cols-3 gap-8">
  //         <div className="flex flex-col gap-4 flex-1 col-span-1">
  //           <h2 className="font-semibold text-lg">Connect</h2>
  //           <Card>
  //             <CardHeader>
  //               <CardTitle className="text-sm tracking-tight">
  //                 Quick Install
  //               </CardTitle>
  //             </CardHeader>
  //             <CardContent>
  //               <CopyCode
  //                 code={'npx -y @x402scan/mcp install'}
  //                 toastMessage="MCP Server URL copied to clipboard"
  //                 className="bg-primary/10"
  //                 copyButtonClassName="bg-transparent hover:bg-primary/20 shadow-none border-0"
  //               />
  //             </CardContent>
  //           </Card>
  //           <TextSeparator
  //             text="or install on your client"
  //             textClassName="text-muted-foreground/50"
  //           />
  //           <div className="flex-1">
  //             <Clients />
  //           </div>
  //         </div>
  //         <div className="col-span-2 flex flex-col gap-4">
  //           <h2 className="font-semibold">Resources</h2>
  //         </div>
  //       </Body>
  //     </>
  //   );
}
