import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SaveDrawWinnerDto {
  @ApiProperty({
    example: 1,
    description: 'Member ID of the winner in the mandal',
  })
  @IsInt()
  @IsNotEmpty()
  memberId: number;

  @ApiPropertyOptional({
    example: 5000,
    description: 'Winning prize or payout amount',
  })
  @IsOptional()
  @IsNumber()
  amount?: number;

  @ApiPropertyOptional({
    example: 'Monthly lucky draw winner',
    description: 'Remarks or note for draw win',
  })
  @IsOptional()
  @IsString()
  remarks?: string;
}
